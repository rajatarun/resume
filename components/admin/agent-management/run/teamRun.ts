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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The management API wraps its payload in `result`.
 *
 * `GET /teams` comes back as `{result: {teams: [...]}}` from the provisioning
 * proxy and as `{teams: [...]}` from anything answering directly, and three
 * components in this app were already unwrapping it by hand before a fourth
 * (this one) read `data.teams`, found undefined, and silently showed no teams
 * at all. Reading the envelope in one tested place is the fix; a fifth
 * hand-rolled `?? data.teams` is how it recurs.
 */
export function unwrapResult<T extends object>(payload: unknown): Partial<T> {
  if (!isRecord(payload)) return {};
  const inner = payload.result;
  // Prefer the envelope when it carries anything, exactly as the older
  // components do -- a response with both should not be read two ways in
  // two tabs.
  if (isRecord(inner) && Object.keys(inner).length > 0) return inner as Partial<T>;
  return payload as Partial<T>;
}

export type TeamSummary = {
  name: string;
  latest_version?: string;
  agent_count?: number | null;
};

/** The team list, whichever shape the API used. */
export function teamsFromResponse(payload: unknown): TeamSummary[] {
  const body = unwrapResult<{ teams?: unknown }>(payload);
  if (!Array.isArray(body.teams)) return [];
  return body.teams
    .filter(isRecord)
    .map((t) => ({
      name: typeof t.name === 'string' ? t.name : '',
      latest_version: typeof t.latest_version === 'string' ? t.latest_version : undefined,
      agent_count: typeof t.agent_count === 'number' ? t.agent_count : null,
    }))
    .filter((t) => t.name);
}

/** One team's config and the version to run, whichever shape the API used. */
export function teamDetailFromResponse(
  payload: unknown,
): { config: TeamConfig | null; version: string } {
  const body = unwrapResult<{ team?: unknown; version?: unknown }>(payload);
  const config = isRecord(body.team) ? (body.team as TeamConfig) : null;
  const version =
    (typeof body.version === 'string' && body.version) ||
    (typeof config?.team?.version === 'string' && config.team.version) ||
    'v1';
  return { config, version };
}

/** The run id from `POST /team/task`, wrapped or not.
 *
 * No id means the run cannot be polled, so it is an error rather than an
 * empty string quietly leaving the UI watching nothing.
 */
export function runIdFromResponse(payload: unknown): string {
  const body = unwrapResult<{ run_id?: unknown }>(payload);
  return typeof body.run_id === 'string' ? body.run_id.trim() : '';
}

export type RequestField = {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'hidden';
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

const FIELD_TYPES = new Set(['text', 'textarea', 'hidden']);

/** Continuation state the page carries between turns; nobody types it. */
export const HIDDEN_TYPE = 'hidden';

/** The name a team uses to declare it accepts follow-up edits. */
export const EDIT_FIELD = 'edit_instruction';
export const PREVIOUS_OUTPUT_FIELD = 'previous_output';
export const PREVIOUS_RUN_FIELD = 'previous_run_id';

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
 * An image a step produced, if it produced one.
 *
 * `image_uri` is the durable `s3://` reference and `image_url` a short-lived
 * signed one; only the second is openable in a browser, and it expires with
 * the Lambda credentials that signed it.
 */
export type RunImage = { url: string; uri: string; prompt: string; label: string };

function asImage(output: unknown, label: string): RunImage | null {
  if (!isRecord(output)) return null;
  const uri = typeof output.image_uri === 'string' ? output.image_uri : '';
  if (!uri) return null;
  return {
    uri,
    url: typeof output.image_url === 'string' ? output.image_url : '',
    prompt: typeof output.prompt === 'string' ? output.prompt : '',
    label,
  };
}

/**
 * Every image the run produced, in workflow order.
 */
export function runImages(config: TeamConfig | null | undefined, result: unknown): RunImage[] {
  return stepOutputs(config, result)
    .map((step) => asImage(step.output, step.label))
    .filter((image): image is RunImage => image !== null);
}

/**
 * The answer to show first.
 *
 * The last step of the declared workflow is *usually* the team's deliverable —
 * the formatter, the writer, the advisor. Not always: the visibility team ends
 * with an illustrator, whose output is a reference to a PNG. Taking the last
 * step blindly would show `{image_uri, model_id, …}` where the post belongs,
 * and the thing a person actually came for would be hidden behind the
 * "earlier steps" disclosure.
 *
 * So an image-producing step is skipped when choosing what to show — the image
 * is rendered separately, beside the copy it illustrates, rather than instead
 * of it. With no workflow to go on, the whole result is shown rather than a
 * guess at which key matters.
 */
export function finalOutput(config: TeamConfig | null | undefined, result: unknown): unknown {
  const outputs = stepOutputs(config, result);
  for (let i = outputs.length - 1; i >= 0; i -= 1) {
    if (!asImage(outputs[i].output, '')) return outputs[i].output;
  }
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


// ── Conversation ────────────────────────────────────────────────────────────
//
// A run is one Step Functions execution and there is no resume: nothing in the
// worker reads `default_jump_to_step`, so a pipeline cannot be re-entered part
// way. A conversation is therefore a *series of runs*, each one carrying the
// previous answer and the edit asked for, and the thread lives here on the
// page. That is why the second turn is not cheaper than the first — the team
// really does run again — and saying so in the UI is better than implying a
// cheap edit that does not exist.

/** Fields a person fills in. Hidden ones are carried, never rendered. */
export function visibleFields(fields: RequestField[]): RequestField[] {
  return fields.filter((f) => f.type !== HIDDEN_TYPE);
}

/**
 * Whether this team accepts follow-ups.
 *
 * Declared, not assumed: a team whose agents were never told what
 * `edit_instruction` means would receive one and ignore it, and the page would
 * show a chat box that silently reruns the same request.
 */
export function supportsConversation(schema: RequestSchema): boolean {
  return schema.fields.some((f) => f.name === EDIT_FIELD);
}

export type Turn = {
  id: string;
  /** What the person said: the first brief, or a follow-up edit. */
  ask: string;
  runId: string;
  state: 'running' | 'succeeded' | 'failed';
  result: unknown;
  error: string;
};

/**
 * The body for a follow-up turn.
 *
 * The original fields are resent because each run starts from nothing — the
 * team has no memory of the first turn beyond what is in this body. The
 * previous answer travels as JSON so the agent revises a structure rather than
 * re-reading its own prose.
 */
export function buildFollowUpBody(
  team: string,
  version: string,
  values: Record<string, string>,
  edit: string,
  previous: { runId: string; output: unknown },
): { team: string; version: string; request: Record<string, string> } {
  const body = buildRunBody(team, version, values);
  body.request[EDIT_FIELD] = edit.trim();
  body.request[PREVIOUS_RUN_FIELD] = previous.runId;
  body.request[PREVIOUS_OUTPUT_FIELD] =
    typeof previous.output === 'string' ? previous.output : JSON.stringify(previous.output ?? null);
  return body;
}

/**
 * The answer a follow-up should revise.
 *
 * The *last succeeded* turn, not the last turn: a failed run has no answer,
 * and sending its absence as `previous_output` would ask the team to revise
 * nothing and quietly produce a fresh first draft instead.
 */
export function lastAnswer(turns: Turn[]): { runId: string; output: unknown } | null {
  for (let i = turns.length - 1; i >= 0; i -= 1) {
    const turn = turns[i];
    if (turn.state === 'succeeded' && turn.result != null) {
      return { runId: turn.runId, output: turn.result };
    }
  }
  return null;
}

/** A follow-up is only sendable with something to say and something to revise. */
export function canFollowUp(turns: Turn[], draft: string): boolean {
  if (!draft.trim()) return false;
  if (turns.some((t) => t.state === 'running')) return false;
  return lastAnswer(turns) !== null;
}
