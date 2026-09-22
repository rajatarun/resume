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
  visibleFields,
  supportsConversation,
  buildFollowUpBody,
  lastAnswer,
  canFollowUp,
  runIdFromResponse,
  stepOutputs,
  teamDetailFromResponse,
  teamsFromResponse,
  type RequestField,
  type RequestSchema,
  type TeamConfig,
  type TeamSummary,
} from '@/components/admin/agent-management/run/teamRun';
import type { Turn } from './teamRun';

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
  // The conversation. A run cannot be resumed -- nothing in the worker reads
  // `default_jump_to_step` -- so a follow-up is a whole new run carrying the
  // previous answer, and the thread lives here rather than on the server.
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
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

  /** Start one run and follow it to a terminal state, as one turn. */
  const runTurn = useCallback(
    async (body: ReturnType<typeof buildRunBody>, ask: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const turnId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setTurns((prev) => [
        ...prev,
        { id: turnId, ask, runId: '', state: 'running', result: null, error: '' },
      ]);
      const settle = (patch: Partial<Turn>) =>
        setTurns((prev) => prev.map((t) => (t.id === turnId ? { ...t, ...patch } : t)));

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
          body,
          signal: controller.signal,
        });
        const id = runIdFromResponse(started);
        if (!id) throw new Error('The API accepted the run but returned no run_id.');
        setRunId(id);
        settle({ runId: id });
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
            settle({ state: 'succeeded', result: state.result });
            setPhase('done');
            return;
          }
          if (state.kind === 'failed') {
            setError(state.error);
            settle({ state: 'failed', error: state.error });
            setPhase('error');
            return;
          }
          const unknown = `The run reported an unrecognised state: ${state.status}`;
          setError(unknown);
          settle({ state: 'failed', error: unknown });
          setPhase('error');
          return;
        }
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') {
          // A turn nobody waited for is not a turn that failed, but it has no
          // answer either -- leaving it "running" would block every follow-up.
          settle({ state: 'failed', error: 'Stopped before it finished.' });
          return;
        }
        const message = (e as Error).message || 'The run could not be started.';
        setError(message);
        settle({ state: 'failed', error: message });
        setPhase('error');
      }
    },
    [],
  );

  const start = useCallback(async () => {
    const missing = missingRequired(visibleFields(schema.fields), values);
    if (missing.length > 0) {
      setError(`Fill in: ${missing.join(', ')}`);
      return;
    }
    setTurns([]);
    await runTurn(buildRunBody(selected, version, values), values[schema.fields[0]?.name] || 'Run');
  }, [runTurn, schema.fields, selected, values, version]);

  /**
   * A follow-up. The team runs again from the top with the previous answer and
   * the edit attached -- there is no partial re-entry to ask for, so the cost
   * is a full run and the UI says so rather than implying a cheap edit.
   */
  const sendFollowUp = useCallback(async () => {
    const previous = lastAnswer(turns);
    if (!previous || !canFollowUp(turns, draft)) return;
    const ask = draft.trim();
    setDraft('');
    await runTurn(buildFollowUpBody(selected, version, values, ask, previous), ask);
  }, [draft, runTurn, selected, turns, values, version]);

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
  // Declared, not assumed: a team whose agents were never told what an edit is
  // would receive one and ignore it.
  const conversational = useMemo(() => supportsConversation(schema), [schema]);

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

        {visibleFields(schema.fields).map((field) => (
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
            {busy ? 'Running…' : turns.length > 0 ? 'Start over' : 'Run this team'}
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
        {turns.length > 0 && (
          <div className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              This conversation
            </p>
            <ol className="space-y-2">
              {turns.map((turn, index) => (
                <li key={turn.id} className="text-sm">
                  <span className="text-slate-500">{index === 0 ? 'Asked' : 'Edit'}:</span>{' '}
                  <span className="text-slate-800 dark:text-slate-200">{turn.ask}</span>
                  <span className="ml-2 text-xs opacity-70">
                    {turn.state === 'running' && 'running…'}
                    {turn.state === 'succeeded' && 'answered'}
                    {turn.state === 'failed' && `failed — ${turn.error}`}
                  </span>
                  {turn.runId && (
                    <span className="ml-2 font-mono text-xs opacity-50">{turn.runId}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        {conversational && lastAnswer(turns) !== null && (
          <div className="space-y-2">
            <label
              htmlFor="follow-up"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Ask for a change
            </label>
            <textarea
              id="follow-up"
              rows={2}
              value={draft}
              disabled={busy}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="e.g. make the opening sharper and cut the third point"
              className="focus-ring w-full rounded-lg border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={sendFollowUp}
                disabled={!canFollowUp(turns, draft)}
                className="focus-ring min-h-[40px] rounded-lg border border-slate-300 px-4 text-sm font-semibold disabled:opacity-50 dark:border-slate-700"
              >
                Send edit
              </button>
              <span className="text-xs text-slate-500 dark:text-slate-500">
                The team runs again from the top with your last answer attached — a pipeline has no
                partial re-entry, so an edit costs a full run.
              </span>
            </div>
          </div>
        )}

        {!conversational && turns.length > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-500">
            This team has not declared an <code>edit_instruction</code> input, so it cannot take
            follow-ups yet — a chat box here would send edits its agents were never told to read.
          </p>
        )}

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
