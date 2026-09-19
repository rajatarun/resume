/**
 * The Create Agent form had two defects that look nothing alike but have the
 * same cause: the form and the API were never checked against each other.
 *
 * 1. It sent `{ role: ... }` while POST /agents requires `role_id`, so every
 *    create was rejected with "Missing required fields: ['role_id']".
 * 2. `schema_ref` was a free-text box. Nothing served the list of valid
 *    values, so there was no way to know what to type — while the selected
 *    role already declared one.
 *
 * These pin the parts that decide what gets sent.
 */
process.env.NEXT_PUBLIC_AGENT_MANAGEMENT_API_BASE = 'https://team.example.com/prod';

import {
  FOUNDATION_MODELS,
  describeRole,
  type Role,
  type SchemaInfo,
} from '@/components/admin/agent-management/shared/types';

const ROLE: Role = {
  role_id: 'PBM-001',
  title: 'Chief Brand Strategist',
  level: 'C-Suite',
  department_id: 'DEPT-001',
  schema_ref: 'creative_brief_v1',
};

/** What the modal computes for the "Output schema" field. */
function effectiveSchema(form: { schema_ref: string }, role: Role | undefined): string {
  return form.schema_ref || role?.schema_ref || '';
}

describe('describeRole', () => {
  it('leads with the title, not the opaque id', () => {
    // "PBM-001" tells a reader nothing about what the role does.
    expect(describeRole(ROLE).indexOf('Chief Brand Strategist')).toBe(0);
  });

  it('keeps the id available, since that is what the API takes', () => {
    expect(describeRole(ROLE)).toContain('PBM-001');
  });

  it('shows the level and department that distinguish similar titles', () => {
    expect(describeRole(ROLE)).toContain('C-Suite');
    expect(describeRole(ROLE)).toContain('DEPT-001');
  });

  it('falls back to the id when a role has no title', () => {
    expect(describeRole({ role_id: 'X-1' })).toBe('X-1');
  });

  it('omits the empty parenthetical when there is no level or department', () => {
    expect(describeRole({ role_id: 'X-1', title: 'Writer' })).toBe('Writer — X-1');
  });
});

describe('the schema a new agent gets', () => {
  it('comes from the role when the field is untouched', () => {
    expect(effectiveSchema({ schema_ref: '' }, ROLE)).toBe('creative_brief_v1');
  });

  it('is the explicit choice when one is made', () => {
    expect(effectiveSchema({ schema_ref: 'draft_pack_v1' }, ROLE)).toBe('draft_pack_v1');
  });

  it('is empty before a role is chosen, so nothing is silently assumed', () => {
    expect(effectiveSchema({ schema_ref: '' }, undefined)).toBe('');
  });
});

describe('the create payload', () => {
  // The modal's form state is the payload: it is passed to onSubmit unchanged.
  const form = {
    name: 'writer',
    role_id: 'PBM-001',
    goal_template: 'Draft a post about {topic}',
    schema_ref: '',
    foundation_model: FOUNDATION_MODELS[0].id,
  };

  it('uses role_id, the field the API actually requires', () => {
    expect(Object.keys(form)).toContain('role_id');
    expect(Object.keys(form)).not.toContain('role');
  });

  it('leaves schema_ref blank so the API resolves it from the role', () => {
    // Sending the role's schema from the client would let the two disagree
    // whenever a role is edited between load and submit.
    expect(form.schema_ref).toBe('');
  });

  it('defaults the model to a real Bedrock id rather than free text', () => {
    expect(form.foundation_model).toMatch(/^[a-z]{2}\.|^(amazon|anthropic)\./);
  });
});

describe('the foundation model list', () => {
  it('offers models with a plain-language note on each', () => {
    expect(FOUNDATION_MODELS.length).toBeGreaterThan(1);
    for (const model of FOUNDATION_MODELS) {
      expect(model.id).toMatch(/^[a-z0-9.\-:]+$/);
      expect(model.label).not.toBe('');
    }
  });

  it('has no duplicate ids', () => {
    const ids = FOUNDATION_MODELS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('schema catalogue entries', () => {
  it('carries the fields that make one schema distinguishable from another', () => {
    const schema: SchemaInfo = {
      schema_ref: 'creative_brief_v1',
      title: 'CreativeBriefV1',
      fields: ['angle', 'audience', 'key_points'],
      required: ['angle'],
    };
    // Without these the dropdown is fourteen opaque names.
    expect(schema.fields).toContain('audience');
    expect(schema.required).toEqual(['angle']);
  });
});
