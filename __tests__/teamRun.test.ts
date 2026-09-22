/**
 * The run flow's data traps. Every one of these is a way for a failed or empty
 * run to look like it worked, which is the only failure mode that matters
 * here: the person asked a team to do something and is reading what came back.
 */
import {
  FALLBACK_SCHEMA,
  buildFollowUpBody,
  buildRunBody,
  canFollowUp,
  finalOutput,
  formatElapsed,
  initialValues,
  interpretStatus,
  lastAnswer,
  missingRequired,
  normalizeRequestSchema,
  pollDelayMs,
  runIdFromResponse,
  runImages,
  stepOutputs,
  supportsConversation,
  teamDetailFromResponse,
  teamsFromResponse,
  visibleFields,
  workflowStepIds,
} from '@/components/admin/agent-management/run/teamRun';
import type { Turn } from '@/components/admin/agent-management/run/teamRun';
import type { TeamConfig } from '@/components/admin/agent-management/run/teamRun';

const CONFIG = {
  team: { name: 'doc_rewrite_team', version: 'v1' },
  request_schema: {
    summary: 'Rewrite a document.',
    fields: [
      { name: 'document_text', label: 'Document', type: 'textarea', required: true },
      { name: 'job_description', label: 'Job description', type: 'textarea', required: true },
      { name: 'tone', label: 'Tone', type: 'text', required: false, placeholder: 'formal' },
    ],
  },
  workflow: [{ step: 'analyzer' }, { step: 'rewriter' }, { step: 'formatter' }],
  agents: [
    { id: 'analyzer', name: 'Document Analyzer' },
    { id: 'rewriter', name: 'Paragraph Rewriter' },
    { id: 'formatter', name: 'Document Formatter' },
  ],
};

describe('reading the team config', () => {
  it('builds the form from the team’s own schema', () => {
    const schema = normalizeRequestSchema(CONFIG);
    expect(schema.fields.map((f) => f.name)).toEqual(['document_text', 'job_description', 'tone']);
    expect(schema.fields[0].type).toBe('textarea');
    expect(schema.fields[2].required).toBe(false);
  });

  it('falls back to a usable form when a team declares nothing', () => {
    // A team added before request_schema existed must still be runnable.
    expect(normalizeRequestSchema({}).fields).toEqual(FALLBACK_SCHEMA.fields);
    expect(normalizeRequestSchema(null).fields).toEqual(FALLBACK_SCHEMA.fields);
  });

  it('falls back rather than rendering a malformed schema', () => {
    expect(normalizeRequestSchema({ request_schema: 'nope' } as never).fields).toEqual(FALLBACK_SCHEMA.fields);
    expect(normalizeRequestSchema({ request_schema: { fields: [] } }).fields).toEqual(FALLBACK_SCHEMA.fields);
    expect(normalizeRequestSchema({ request_schema: { fields: [{ label: 'no name' }] } }).fields)
      .toEqual(FALLBACK_SCHEMA.fields);
  });

  it('drops duplicate field names rather than rendering two inputs for one key', () => {
    const schema = normalizeRequestSchema({
      request_schema: { summary: 's', fields: [{ name: 'a', label: 'A' }, { name: 'a', label: 'Again' }] },
    });
    expect(schema.fields).toHaveLength(1);
  });

  it('treats an unknown field type as text rather than rendering nothing', () => {
    const schema = normalizeRequestSchema({
      request_schema: { summary: 's', fields: [{ name: 'a', label: 'A', type: 'colour-picker' }] },
    });
    expect(schema.fields[0].type).toBe('text');
  });
});

describe('what gets submitted', () => {
  it('blocks a run that is missing a required answer', () => {
    const fields = normalizeRequestSchema(CONFIG).fields;
    const values = { document_text: 'doc', job_description: '', tone: '' };
    expect(missingRequired(fields, values)).toEqual(['Job description']);
  });

  it('treats whitespace as missing', () => {
    const fields = normalizeRequestSchema(CONFIG).fields;
    expect(missingRequired(fields, { document_text: '   ', job_description: 'x' })).toEqual(['Document']);
  });

  it('lets a run start once every required answer is present', () => {
    const fields = normalizeRequestSchema(CONFIG).fields;
    expect(missingRequired(fields, { document_text: 'a', job_description: 'b' })).toEqual([]);
  });

  it('omits blank optional fields instead of sending empty strings', () => {
    // The request is rendered into the prompt; "tone": "" tells the model
    // there is a tone and it is nothing.
    const body = buildRunBody('doc_rewrite_team', 'v1', {
      document_text: ' doc ',
      job_description: 'jd',
      tone: '   ',
    });
    expect(body).toEqual({
      team: 'doc_rewrite_team',
      version: 'v1',
      request: { document_text: 'doc', job_description: 'jd' },
    });
  });

  it('starts every field empty', () => {
    expect(initialValues(normalizeRequestSchema(CONFIG).fields)).toEqual({
      document_text: '', job_description: '', tone: '',
    });
  });
});

describe('reading the run status', () => {
  it('reports a finished run with its result', () => {
    expect(interpretStatus({ status: 'SUCCEEDED', result: { steps: {} } }))
      .toEqual({ kind: 'succeeded', result: { steps: {} } });
  });

  it('keeps polling while the run is going', () => {
    expect(interpretStatus({ status: 'RUNNING' })).toEqual({ kind: 'running' });
  });

  it.each(['FAILED', 'TIMED_OUT', 'ABORTED'])('treats %s as a failure, not a success', (status) => {
    // All three arrive as HTTP 200. Trusting the status code reports every
    // one of them as a completed run.
    const state = interpretStatus({ status, error: 'the cause' });
    expect(state.kind).toBe('failed');
    expect(state).toHaveProperty('error', 'the cause');
  });

  it('still explains a failure that carries no cause', () => {
    const state = interpretStatus({ status: 'FAILED' });
    expect(state.kind).toBe('failed');
    expect((state as { error: string }).error).toContain('FAILED');
  });

  it('does not claim success for an unrecognised status', () => {
    expect(interpretStatus({ status: 'PENDING' }).kind).toBe('unknown');
    expect(interpretStatus({}).kind).toBe('unknown');
    expect(interpretStatus(null).kind).toBe('unknown');
    expect(interpretStatus('SUCCEEDED').kind).toBe('unknown');
  });

  it('accepts a lowercase status rather than reading it as unknown', () => {
    expect(interpretStatus({ status: 'succeeded', result: 1 }).kind).toBe('succeeded');
  });
});

describe('reading the output', () => {
  const RESULT = {
    run_id: 'r1',
    status: 'SUCCEEDED',
    steps: {
      analyzer: { gaps: ['a'] },
      rewriter: { sections: ['b'] },
      formatter: { document: 'the final text' },
    },
  };

  it('knows the pipeline’s declared order', () => {
    expect(workflowStepIds(CONFIG)).toEqual(['analyzer', 'rewriter', 'formatter']);
  });

  it('shows the last step as the answer, not the first', () => {
    // The deliverable is the formatter's document. Showing the analyzer's
    // notes would bury what was actually asked for.
    expect(finalOutput(CONFIG, RESULT)).toEqual({ document: 'the final text' });
  });

  it('labels each step with its agent’s name', () => {
    expect(stepOutputs(CONFIG, RESULT).map((s) => s.label)).toEqual([
      'Document Analyzer', 'Paragraph Rewriter', 'Document Formatter',
    ]);
  });

  it('orders steps by the workflow, not by object key order', () => {
    const shuffled = { steps: { formatter: 3, analyzer: 1, rewriter: 2 } };
    expect(stepOutputs(CONFIG, shuffled).map((s) => s.id))
      .toEqual(['analyzer', 'rewriter', 'formatter']);
  });

  it('still shows a step that ran but is not in the declared workflow', () => {
    const extra = { steps: { analyzer: 1, surprise: 2 } };
    expect(stepOutputs(CONFIG, extra).map((s) => s.id)).toEqual(['analyzer', 'surprise']);
  });

  it('shows the whole result when there is no workflow to go on', () => {
    const bare = { anything: 'here' };
    expect(finalOutput({}, bare)).toEqual(bare);
  });

  it('does not invent an answer from an empty result', () => {
    expect(stepOutputs(CONFIG, null)).toEqual([]);
    expect(stepOutputs(CONFIG, { steps: null })).toEqual([]);
    expect(finalOutput(CONFIG, null)).toBeNull();
  });
});

describe('polling cadence', () => {
  it('starts responsive and backs off', () => {
    expect(pollDelayMs(0)).toBe(1000);
    expect(pollDelayMs(10)).toBe(5000);
  });

  it('never returns zero, which would poll in a tight loop', () => {
    for (let i = -2; i < 20; i += 1) expect(pollDelayMs(i)).toBeGreaterThanOrEqual(1000);
  });
});

describe('elapsed time', () => {
  it('reads as seconds under a minute and minutes above', () => {
    expect(formatElapsed(4_000)).toBe('4s');
    expect(formatElapsed(65_000)).toBe('1m 05s');
    expect(formatElapsed(-5)).toBe('0s');
  });
});

describe('the response envelope', () => {
  // The management API wraps its payload in `result`. Three components were
  // already unwrapping it by hand when a fourth read `data.teams`, got
  // undefined, and showed an empty team picker with no error — the UI's
  // "teams are not loading".
  const WRAPPED = {
    result: {
      teams: [
        { name: 'doc_rewrite_team', latest_version: 'v1', agent_count: 3 },
        { name: 'tarun_visibility_team', latest_version: 'v1', agent_count: 6 },
      ],
    },
  };
  const BARE = { teams: [{ name: 'doc_rewrite_team', latest_version: 'v1', agent_count: 3 }] };

  it('reads the team list out of a wrapped response', () => {
    expect(teamsFromResponse(WRAPPED).map((t) => t.name)).toEqual([
      'doc_rewrite_team', 'tarun_visibility_team',
    ]);
  });

  it('still reads an unwrapped response', () => {
    expect(teamsFromResponse(BARE).map((t) => t.name)).toEqual(['doc_rewrite_team']);
  });

  it('carries the fields the picker shows', () => {
    const [first] = teamsFromResponse(WRAPPED);
    expect(first).toEqual({ name: 'doc_rewrite_team', latest_version: 'v1', agent_count: 3 });
  });

  it('returns nothing rather than throwing on junk', () => {
    for (const junk of [null, undefined, 'a string', 42, [], {}, { result: {} }]) {
      expect(teamsFromResponse(junk)).toEqual([]);
    }
  });

  it('drops entries with no name, which cannot be run', () => {
    const mixed = { result: { teams: [{ name: 'ok' }, {}, { name: '' }, 'nope', null] } };
    expect(teamsFromResponse(mixed).map((t) => t.name)).toEqual(['ok']);
  });

  it('reads the team config out of a wrapped detail response', () => {
    const wrapped = { result: { team: { team: { name: 'doc_rewrite_team' } }, version: 'v2' } };
    const { config, version } = teamDetailFromResponse(wrapped);
    expect(config?.team?.name).toBe('doc_rewrite_team');
    expect(version).toBe('v2');
  });

  it('still reads an unwrapped detail response', () => {
    const bare = { team: { team: { name: 'x', version: 'v3' } } };
    const { config, version } = teamDetailFromResponse(bare);
    expect(config?.team?.name).toBe('x');
    expect(version).toBe('v3');
  });

  it('falls back to v1 when no version is given anywhere', () => {
    expect(teamDetailFromResponse({ team: {} }).version).toBe('v1');
  });

  it('never returns an empty version, which would fail the run with a 400', () => {
    // POST /team/task rejects a request without team and version.
    for (const payload of [null, {}, { result: {} }, { team: null }]) {
      expect(teamDetailFromResponse(payload).version).toBeTruthy();
    }
  });

  it('prefers the envelope when both shapes are present', () => {
    // Two tabs must not read the same response two different ways.
    const both = { teams: [{ name: 'bare' }], result: { teams: [{ name: 'wrapped' }] } };
    expect(teamsFromResponse(both).map((t) => t.name)).toEqual(['wrapped']);
  });

  it('ignores an empty envelope rather than losing the payload', () => {
    const odd = { result: {}, teams: [{ name: 'still here' }] };
    expect(teamsFromResponse(odd).map((t) => t.name)).toEqual(['still here']);
  });
});

describe('the run id', () => {
  it('is read out of a wrapped start response', () => {
    expect(runIdFromResponse({ result: { run_id: 'run-123' } })).toBe('run-123');
  });

  it('is read out of an unwrapped start response', () => {
    expect(runIdFromResponse({ run_id: 'run-123' })).toBe('run-123');
  });

  it('is empty when the API returned none, so the caller can say so', () => {
    // An empty string here must surface as an error; silently polling a
    // blank id would leave the UI watching nothing forever.
    for (const junk of [null, {}, { result: {} }, { run_id: 42 }, { run_id: '   ' }]) {
      expect(runIdFromResponse(junk)).toBe('');
    }
  });
});

describe('image steps', () => {
  const config = {
    workflow: [
      { step: 'writer' },
      { step: 'editor' },
      { step: 'illustrator' },
    ],
    agents: [
      { id: 'writer', name: 'Writer' },
      { id: 'editor', name: 'Managing Editor' },
      { id: 'illustrator', name: 'Visual Designer' },
    ],
  } as unknown as TeamConfig;

  const result = {
    steps: {
      writer: { drafts: ['a'] },
      editor: { post: 'the approved copy' },
      illustrator: {
        image_uri: 's3://bucket/runs/r1/illustrator.png',
        image_url: 'https://bucket.s3.amazonaws.com/runs/r1/illustrator.png?sig=x',
        prompt: 'art direction, the approved copy',
        model_id: 'amazon.nova-canvas-v1:0',
      },
    },
  };

  it('shows the post, not the image reference, as the deliverable', () => {
    // The illustrator is last in the workflow. Taking the last step blindly
    // would put {image_uri, model_id, ...} where the post belongs and bury
    // the thing a person came for behind a disclosure.
    expect(finalOutput(config, result)).toEqual({ post: 'the approved copy' });
  });

  it('still takes the last step when nothing is an image', () => {
    const textOnly = {
      steps: { writer: { drafts: ['a'] }, editor: { post: 'final' } },
    };
    const cfg = {
      workflow: [{ step: 'writer' }, { step: 'editor' }],
      agents: [{ id: 'writer' }, { id: 'editor' }],
    } as unknown as TeamConfig;
    expect(finalOutput(cfg, textOnly)).toEqual({ post: 'final' });
  });

  it('collects the images separately so they can be rendered', () => {
    const images = runImages(config, result);
    expect(images).toHaveLength(1);
    expect(images[0].url).toContain('https://');
    expect(images[0].uri).toBe('s3://bucket/runs/r1/illustrator.png');
    expect(images[0].label).toBe('Visual Designer');
  });

  it('reports no images for a run that produced none', () => {
    expect(runImages(config, { steps: { editor: { post: 'x' } } })).toEqual([]);
  });

  it('keeps the durable uri when signing failed', () => {
    // presign() returns "" rather than failing the step, so the UI has to
    // cope with an image it can reference but not display.
    const unsigned = {
      steps: { illustrator: { image_uri: 's3://b/k.png', image_url: '' } },
    };
    const [image] = runImages(config, unsigned);
    expect(image.uri).toBe('s3://b/k.png');
    expect(image.url).toBe('');
  });

  it('does not mistake an ordinary output for an image', () => {
    const notAnImage = { steps: { editor: { post: 'x', model_id: 'm' } } };
    expect(runImages(config, notAnImage)).toEqual([]);
  });
});

// ── Conversation ────────────────────────────────────────────────────────────
//
// There is no resume in the pipeline: nothing reads `default_jump_to_step`, so
// a conversation is a series of whole runs, each carrying the previous answer.

describe('conversational follow-ups', () => {
  const schema = {
    summary: 's',
    fields: [
      { name: 'topic', label: 'Topic', type: 'text' as const, required: true },
      { name: 'edit_instruction', label: 'Change', type: 'text' as const, required: false },
      { name: 'previous_output', label: 'Prev', type: 'hidden' as const, required: false },
      { name: 'previous_run_id', label: 'Run', type: 'hidden' as const, required: false },
    ],
  };

  const turn = (over: Partial<Turn> = {}): Turn => ({
    id: 't', ask: 'a', runId: 'r', state: 'succeeded', result: { post: 'first' }, error: '',
    ...over,
  });

  it('hides continuation fields from the form', () => {
    // A person cannot type the previous run's output, and showing them a box
    // for it would be asking them to.
    expect(visibleFields(schema.fields).map((f) => f.name)).toEqual(['topic', 'edit_instruction']);
  });

  it('treats a team that never declared edit_instruction as one-shot', () => {
    // Otherwise the page offers a chat box to agents that were never told what
    // an edit is, and every follow-up silently reruns the same request.
    expect(supportsConversation(schema)).toBe(true);
    expect(supportsConversation({ summary: 's', fields: [schema.fields[0]] })).toBe(false);
  });

  it('resends the original fields, because each run starts from nothing', () => {
    const body = buildFollowUpBody('t', 'v1', { topic: 'runtimes' }, 'shorter', {
      runId: 'run-1', output: { post: 'first' },
    });
    expect(body.request.topic).toBe('runtimes');
    expect(body.request.edit_instruction).toBe('shorter');
    expect(body.request.previous_run_id).toBe('run-1');
    expect(JSON.parse(body.request.previous_output)).toEqual({ post: 'first' });
  });

  it('revises the last succeeded answer, not the last turn', () => {
    // A failed run has no answer. Sending its absence would ask the team to
    // revise nothing, and it would produce a fresh first draft instead.
    const turns = [turn({ runId: 'ok' }), turn({ state: 'failed', result: null, runId: 'bad' })];
    expect(lastAnswer(turns)?.runId).toBe('ok');
  });

  it('has nothing to revise before the first answer', () => {
    expect(lastAnswer([])).toBeNull();
    expect(lastAnswer([turn({ state: 'running', result: null })])).toBeNull();
  });

  it('refuses to send while a turn is still running', () => {
    // Two runs in flight would race, and the second would revise an answer the
    // first is about to replace.
    expect(canFollowUp([turn()], 'make it shorter')).toBe(true);
    expect(canFollowUp([turn(), turn({ state: 'running', result: null })], 'x')).toBe(false);
    expect(canFollowUp([turn()], '   ')).toBe(false);
    expect(canFollowUp([], 'first thing')).toBe(false);
  });

  it('sends a string answer through unquoted', () => {
    const body = buildFollowUpBody('t', 'v1', {}, 'e', { runId: 'r', output: 'plain text' });
    expect(body.request.previous_output).toBe('plain text');
  });
});
