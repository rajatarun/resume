/**
 * The run flow's data traps. Every one of these is a way for a failed or empty
 * run to look like it worked, which is the only failure mode that matters
 * here: the person asked a team to do something and is reading what came back.
 */
import {
  FALLBACK_SCHEMA,
  buildRunBody,
  finalOutput,
  formatElapsed,
  initialValues,
  interpretStatus,
  missingRequired,
  normalizeRequestSchema,
  pollDelayMs,
  stepOutputs,
  workflowStepIds,
} from '@/components/admin/agent-management/run/teamRun';

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
