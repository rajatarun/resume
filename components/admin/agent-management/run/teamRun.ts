/**
 * Asking a team to do something, and reading back what it produced.
 *
 * Kept separate from the component because every trap in this flow is a data
 * trap, not a rendering one, and each is a way to look like it worked:
 *
 *  - `POST /team/task` returns **202** with a `run_id`. Nothing has run yet.
 *  - **A FAILED run is a 200.** The failure is in the body. Reading the HTTP
 *    status alone records every failed run as a success.
 *  - The result is every step's output, keyed by step id. The deliverable is
 *    the *last* step of the declared workflow; showing the first, or the whole
 *    blob, buries the answer the person asked for.
 *
 * The form is built from the team's own `request_schema`, so adding a team
 * stays a JSON change rather than a UI change.
 */

export type RequestField = {
  name: string;
  label: string;
  type: 'text' | 'textarea';
  required: boolean;
  placeholder?: string;
};

export type RequestSchema = {
  summary: string;
  fields: RequestField[];
};

export type TeamConfig = {
  team?: { name?: string; version?: string };
  request_schema?: unknown;
  workflow?: Array<{ step?: string }>;
  agents?: Array<{ id?: string; name?: string }>;
};

/** A team whose config predates request_schema still has to be runnable. */
export const FALLBACK_SCHEMA: RequestSchema = {
  summary: 'This team has not described its inputs. Describe the task in your own words.',
  fields: [
    {
      name: 'topic',
      label: 'What should this team do?',
      type: 'textarea',
      required: true,
      placeholder: 'Describe the task…',
    },
  ],
};

const FIELD_TYPES = new Set(['text', 'textarea']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The team's declared inputs, or a usable default.
 *
 * Anything malformed degrades to the fallback rather than throwing: a bad
 * schema should cost the person a tailored form, not the ability to run the
 * team at all.
 */
export function normalizeRequestSchema(config: TeamConfig | null | undefined): RequestSchema {
  const raw = config?.request_schema;
  if (!isRecord(raw) || !Array.isArray(raw.fields)) return FALLBACK_SCHEMA;

  const fields: RequestField[] = [];
  for (const entry of raw.fields) {
    if (!isRecord(entry)) continue;
    const name = typeof entry.name === 'string' ? entry.name.trim() : '';
    if (!name || fields.some((f) => f.name === name)) continue;
    const type = typeof entry.type === 'string' && FIELD_TYPES.has(entry.type) ? entry.type : 'text';
    fields.push({
      name,
      label: typeof entry.label === 'string' && entry.label.trim() ? entry.label : name,
      type: type as RequestField['type'],
      required: entry.required === true,
      placeholder: typeof entry.placeholder === 'string' ? entry.placeholder : undefined,
    });
  }
  if (fields.length === 0) return FALLBACK_SCHEMA;

  const summary = typeof raw.summary === 'string' && raw.summary.trim() ? raw.summary.trim() : '';
  return { summary, fields };
}

export function initialValues(fields: RequestField[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.name, '']));
}

/** Required fields left blank. Whitespace is blank. */
export function missingRequired(
  fields: RequestField[],
  values: Record<string, string>,
): string[] {
  return fields.filter((f) => f.required && !(values[f.name] ?? '').trim()).map((f) => f.label);
}

/**
 * The POST body.
 *
 * Empty optional fields are dropped rather than sent as "": the request is
 * rendered into the prompt, and `"audience": ""` tells the model there is an
 * audience and it is nothing.
 */
export function buildRunBody(
  team: string,
  version: string,
  values: Record<string, string>,
): { team: string; version: string; request: Record<string, string> } {
  const request: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    const trimmed = (value ?? '').trim();
    if (trimmed) request[key] = trimmed;
  }
  return { team, version, request };
}

export type RunState =
  | { kind: 'running' }
  | { kind: 'succeeded'; result: unknown }
  | { kind: 'failed'; error: string }
  | { kind: 'unknown'; status: string };

/**
 * What the status body actually says.
 *
 * FAILED, TIMED_OUT and ABORTED all arrive as HTTP 200. A caller that trusts
 * the status code reports every one of them as a success — which is exactly
 * the bug the API's own docs warn about.
 */
export function interpretStatus(payload: unknown): RunState {
  if (!isRecord(payload)) return { kind: 'unknown', status: 'no response body' };
  const status = typeof payload.status === 'string' ? payload.status.toUpperCase() : '';

  if (status === 'SUCCEEDED') return { kind: 'succeeded', result: payload.result ?? null };
  if (status === 'RUNNING') return { kind: 'running' };
  if (status === 'FAILED' || status === 'TIMED_OUT' || status === 'ABORTED') {
    const error = typeof payload.error === 'string' && payload.error.trim()
      ? payload.error
      : `The run ended as ${status}.`;
    return { kind: 'failed', error };
  }
  return { kind: 'unknown', status: status || 'missing status' };
}

/** Step ids in declared order — the pipeline's shape, from the team's config. */
export function workflowStepIds(config: TeamConfig | null | undefined): string[] {
  if (!Array.isArray(config?.workflow)) return [];
  return config!.workflow!
    .map((s) => (typeof s?.step === 'string' ? s.step : ''))
    .filter(Boolean);
}

export type StepOutput = { id: string; label: string; output: unknown };

/** Every step's output, in workflow order, labelled with the agent's name. */
export function stepOutputs(config: TeamConfig | null | undefined, result: unknown): StepOutput[] {
  if (!isRecord(result)) return [];
  const steps = isRecord(result.steps) ? result.steps : null;
  if (!steps) return [];

  const names = new Map<string, string>();
  for (const agent of config?.agents ?? []) {
    if (agent?.id && agent?.name) names.set(agent.id, agent.name);
  }

  const ordered = workflowStepIds(config).filter((id) => id in steps);
  // A step that ran but is not in the declared workflow still has output
  // worth showing; losing it silently would hide the run's real behaviour.
  const extra = Object.keys(steps).filter((id) => !ordered.includes(id));
  return [...ordered, ...extra].map((id) => ({
    id,
    label: names.get(id) ?? id,
    output: steps[id],
  }));
}

/**
 * The answer to show first.
 *
 * The last step of the declared workflow is the team's deliverable — the
 * formatter, the writer, the advisor. With no workflow to go on, the whole
 * result is shown rather than a guess at which key matters.
 */
export function finalOutput(config: TeamConfig | null | undefined, result: unknown): unknown {
  const outputs = stepOutputs(config, result);
  if (outputs.length > 0) return outputs[outputs.length - 1].output;
  return result ?? null;
}

/**
 * How long to wait before polling again.
 *
 * A pipeline is minutes of Bedrock calls, so a fixed one-second poll is
 * hundreds of pointless requests. This starts responsive and backs off to
 * five seconds, which is well inside how fast a step completes.
 */
export function pollDelayMs(attempt: number): number {
  const steps = [1000, 1000, 2000, 3000, 5000];
  return steps[Math.min(Math.max(attempt, 0), steps.length - 1)];
}

/** Human-readable elapsed time for a run in progress. */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0 ? `${minutes}m ${String(seconds).padStart(2, '0')}s` : `${seconds}s`;
}
