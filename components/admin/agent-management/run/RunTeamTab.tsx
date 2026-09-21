'use client';

/**
 * Ask a team to do something, and see what it produced.
 *
 * This is the platform's purpose, and until now it had no path in the UI at
 * all: you could chat with one agent, list teams, and edit prompts, but not
 * run the pipeline the whole thing exists for.
 *
 * The form comes from the team's own `request_schema`, so a new team is still
 * a JSON change. The run is asynchronous — 202 with a `run_id`, then poll —
 * and a FAILED run arrives as a 200, so the status body decides what is shown,
 * never the HTTP code.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '@/components/admin/agent-management/shared/apiFetch';
import { ErrorBanner } from '@/components/admin/agent-management/shared/ErrorBanner';
import { JsonViewer } from '@/components/admin/agent-management/shared/JsonViewer';
import {
  buildRunBody,
  finalOutput,
  runImages,
  formatElapsed,
  initialValues,
  interpretStatus,
  missingRequired,
  normalizeRequestSchema,
  pollDelayMs,
  runIdFromResponse,
  stepOutputs,
  teamDetailFromResponse,
  teamsFromResponse,
  type RequestField,
  type RequestSchema,
  type TeamConfig,
  type TeamSummary,
} from '@/components/admin/agent-management/run/teamRun';

type Phase = 'idle' | 'starting' | 'running' | 'done' | 'error';

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('aborted', 'AbortError'));
    }, { once: true });
  });
}

function Field({
  field,
  value,
  onChange,
  disabled,
}: {
  field: RequestField;
  value: string;
  onChange: (next: string) => void;
  disabled: boolean;
}) {
  const id = `run-field-${field.name}`;
  const shared =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ' +
    'placeholder:text-slate-400 focus-ring disabled:opacity-60 ' +
    'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {field.label}
        {field.required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
        {!field.required && <span className="ml-2 text-xs font-normal text-slate-500">optional</span>}
      </label>
      {field.type === 'textarea' ? (
        <textarea
          id={id}
          rows={6}
          className={shared}
          placeholder={field.placeholder}
          value={value}
          disabled={disabled}
          required={field.required}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          type="text"
          className={shared}
          placeholder={field.placeholder}
          value={value}
          disabled={disabled}
          required={field.required}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

export function RunTeamTab() {
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [selected, setSelected] = useState('');
  const [config, setConfig] = useState<TeamConfig | null>(null);
  const [version, setVersion] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [runId, setRunId] = useState('');
  const [result, setResult] = useState<unknown>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const schema: RequestSchema = useMemo(() => normalizeRequestSchema(config), [config]);
  const busy = phase === 'starting' || phase === 'running';

  useEffect(() => {
    let live = true;
    apiFetch<unknown>('/teams')
      .then((payload) => {
        if (!live) return;
        // The API wraps this in `result`; reading `payload.teams` directly is
        // why the picker was empty.
        const list = teamsFromResponse(payload);
        setTeams(list);
        if (list.length === 0) {
          setError('The API returned no teams. Check that team configs are synced to S3.');
        }
        if (list.length > 0) setSelected((current) => current || list[0].name);
      })
      .catch((e: Error) => live && setError(`Could not list teams: ${e.message}`));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    let live = true;
    setConfig(null);
    apiFetch<unknown>(`/teams/${encodeURIComponent(selected)}`)
      .then((payload) => {
        if (!live) return;
        const { config: loaded, version: loadedVersion } = teamDetailFromResponse(payload);
        setConfig(loaded);
        setVersion(loadedVersion);
      })
      .catch((e: Error) => live && setError(`Could not load ${selected}: ${e.message}`));
    return () => {
      live = false;
    };
  }, [selected]);

  // Reset the form whenever the fields change identity, so a value typed for
  // one team never rides along into another team's request.
  const fieldKey = schema.fields.map((f) => f.name).join('|');
  useEffect(() => {
    setValues(initialValues(schema.fields));
    setResult(null);
    setRunId('');
    setPhase('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldKey, selected]);

  useEffect(() => {
    if (phase !== 'running' || !startedAt) return;
    const timer = setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    return () => clearInterval(timer);
  }, [phase, startedAt]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const start = useCallback(async () => {
    const missing = missingRequired(schema.fields, values);
    if (missing.length > 0) {
      setError(`Fill in: ${missing.join(', ')}`);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError('');
    setResult(null);
    setShowAllSteps(false);
    setPhase('starting');
    const began = Date.now();
    setStartedAt(began);
    setElapsed(0);

    try {
      // 202 with a run_id. Nothing has run yet.
      const started = await apiFetch<unknown>('/team/task', {
        method: 'POST',
        body: buildRunBody(selected, version, values),
        signal: controller.signal,
      });
      // Wrapped here too, for the same reason.
      const id = runIdFromResponse(started);
      if (!id) throw new Error('The API accepted the run but returned no run_id.');
      setRunId(id);
      setPhase('running');

      for (let attempt = 0; ; attempt += 1) {
        await sleep(pollDelayMs(attempt), controller.signal);
        const payload = await apiFetch<unknown>(`/team/task/${encodeURIComponent(id)}`, {
          signal: controller.signal,
        });
        // The body decides, not the status code: FAILED arrives as a 200.
        const state = interpretStatus(payload);
        if (state.kind === 'running') continue;
        if (state.kind === 'succeeded') {
          setResult(state.result);
          setPhase('done');
          return;
        }
        if (state.kind === 'failed') {
          setError(state.error);
          setPhase('error');
          return;
        }
        setError(`The run reported an unrecognised state: ${state.status}`);
        setPhase('error');
        return;
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setError((e as Error).message || 'The run could not be started.');
      setPhase('error');
    }
  }, [schema.fields, selected, values, version]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setPhase('idle');
  }, []);

  const steps = useMemo(() => stepOutputs(config, result), [config, result]);
  const answer = useMemo(() => finalOutput(config, result), [config, result]);
  // Rendered beside the copy rather than instead of it: the deliverable is
  // the post, and the illustration is of it.
  const images = useMemo(() => runImages(config, result), [config, result]);
  const deliverable = steps.length > 0 ? steps[steps.length - 1] : null;

  return (
    <div className="space-y-5">
      {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

      <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <div className="space-y-1.5">
          <label htmlFor="run-team" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Team
          </label>
          <select
            id="run-team"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-ring disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            value={selected}
            disabled={busy || teams.length === 0}
            onChange={(e) => setSelected(e.target.value)}
          >
            {teams.length === 0 && <option value="">Loading teams…</option>}
            {teams.map((team) => (
              <option key={team.name} value={team.name}>
                {team.name}
                {typeof team.agent_count === 'number' ? ` · ${team.agent_count} agents` : ''}
              </option>
            ))}
          </select>
          {schema.summary && (
            <p className="pt-1 text-sm text-slate-600 dark:text-slate-400">{schema.summary}</p>
          )}
        </div>

        {schema.fields.map((field) => (
          <Field
            key={field.name}
            field={field}
            value={values[field.name] ?? ''}
            disabled={busy}
            onChange={(next) => setValues((prev) => ({ ...prev, [field.name]: next }))}
          />
        ))}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={start}
            disabled={busy || !selected}
            className="focus-ring min-h-[40px] rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
          >
            {busy ? 'Running…' : 'Run this team'}
          </button>
          {busy && (
            <>
              <button
                type="button"
                onClick={stop}
                className="focus-ring min-h-[40px] rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700"
              >
                Stop watching
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400" role="status">
                {phase === 'starting' ? 'Starting…' : `Running for ${formatElapsed(elapsed)}`}
                {runId && <span className="ml-2 font-mono text-xs opacity-70">{runId}</span>}
              </span>
            </>
          )}
        </div>
        {busy && (
          <p className="text-xs text-slate-500 dark:text-slate-500">
            A pipeline runs its agents in sequence, so this takes minutes rather than seconds.
            Leaving this tab stops the watching, not the run — it keeps going, and the run id above
            reaches it again.
          </p>
        )}
      </div>

      {phase === 'done' && (
        <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {deliverable ? deliverable.label : 'Result'}
            </h3>
            <span className="text-xs text-slate-500">
              finished in {formatElapsed(elapsed)}
              {steps.length > 0 && ` · ${steps.length} step${steps.length === 1 ? '' : 's'}`}
            </span>
          </div>
          <JsonViewer value={answer} />

          {images.length > 0 && (
            <div className="space-y-3">
              {images.map((image) => (
                <figure key={image.uri} className="space-y-2">
                  {image.url ? (
                    <img
                      src={image.url}
                      alt={image.prompt || `Generated by ${image.label}`}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800"
                      loading="lazy"
                    />
                  ) : (
                    // presign() returns "" rather than failing the step, so the
                    // image exists and simply cannot be shown here.
                    <p className="rounded-lg border border-dashed border-slate-300 p-3 text-xs text-slate-500 dark:border-slate-700">
                      The image was generated but could not be signed for
                      viewing. It is stored at <code>{image.uri}</code>.
                    </p>
                  )}
                  <figcaption className="text-xs text-slate-500">
                    {image.label}
                    {image.url && ' · link expires a few hours after the run'}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}

          {steps.length > 1 && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowAllSteps((v) => !v)}
                className="focus-ring rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-700"
                aria-expanded={showAllSteps}
              >
                {showAllSteps ? 'Hide' : 'Show'} what each agent produced
              </button>
              {showAllSteps &&
                steps.slice(0, -1).map((step) => (
                  <div key={step.id} className="space-y-1.5">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {step.label}
                    </p>
                    <JsonViewer value={step.output} />
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
