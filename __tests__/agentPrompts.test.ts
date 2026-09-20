/**
 * The Agents tab was managing the wrong agents.
 *
 * It listed `/agents` (Bedrock Agents Classic), showed an `instruction` field
 * and PUT edits back to a Bedrock agent resource. None of that runs:
 * TeamWeave's substrate is AgentCore, Classic provisioning is skipped on every
 * deploy, and the agents that execute live in the team configs where the
 * system prompt is `goal_template`. Editing a prompt there changed a resource
 * nothing invokes — and reported success, which is the worst version.
 *
 * These cover the replacement: agents read from the configs the orchestrator
 * runs from, and a preview of the envelope those prompts sit inside.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  OUTPUT_CONTRACT_LINES,
  composePromptPreview,
  flattenAgents,
  promptWarnings,
  withUpdatedPrompt,
  type TeamDoc,
} from '@/components/admin/agent-management/shared/agentPrompts';

const VISIBILITY: TeamDoc = {
  team: { name: 'visibility' },
  globals: { north_star: 'Grow reach', hard_constraints: ['No hype', 'Cite sources'] },
  agents: [
    { id: 'director', name: 'Content Marketing Director', role_id: 'PBM-001',
      schema_ref: 'creative_brief_v1', goal_template: 'Set the angle.',
      bedrock: { model_id: 'us.amazon.nova-micro-v1:0' } },
    { id: 'writer', name: 'Content Writer', role_id: 'PBM-006', goal_template: 'Draft it.' },
    { id: 'retired', name: 'Old Agent', goal_template: 'Nothing runs me.' },
  ],
  workflow: [{ step: 'director' }, { step: 'writer' }],
};

const IMPROVEMENT: TeamDoc = {
  team: { name: 'improvement' },
  agents: [{ id: 'coach', goal_template: 'Plan the week.' }],
  workflow: [{ step: 'coach' }],
};

const TEAMS = { 'teams/v/team.json': VISIBILITY, 'teams/i/team.json': IMPROVEMENT };

describe('the agents the tab should show', () => {
  it('reads them from the team configs, not from Bedrock', () => {
    const rows = flattenAgents(TEAMS);
    expect(rows.map((r) => r.agentId)).toEqual(['coach', 'director', 'writer', 'retired']);
  });

  it('exposes the system prompt that actually runs', () => {
    const director = flattenAgents(TEAMS).find((r) => r.agentId === 'director')!;
    expect(director.prompt).toBe('Set the angle.');
  });

  it('orders agents by their position in the pipeline', () => {
    /* The workflow order is the order a reader thinks in; alphabetical would
     * scatter a pipeline across the list.
     *
     * The ids here run *against* alphabetical deliberately: in the main
     * fixture pipeline order and alphabetical order coincide, so sorting by
     * id passed this assertion happily. */
    const rows = flattenAgents({
      a: {
        team: { name: 't' },
        agents: [{ id: 'zulu' }, { id: 'alpha' }, { id: 'mike' }],
        workflow: [{ step: 'zulu' }, { step: 'mike' }, { step: 'alpha' }],
      },
    });
    expect(rows.map((r) => r.agentId)).toEqual(['zulu', 'mike', 'alpha']);
    expect(rows.map((r) => r.stepNumber)).toEqual([1, 2, 3]);
  });

  it('sorts agents nothing runs to the end', () => {
    const visibility = flattenAgents(TEAMS).filter((r) => r.teamName === 'visibility');
    expect(visibility.map((r) => r.agentId)).toEqual(['director', 'writer', 'retired']);
  });

  it('flags an agent no workflow step runs', () => {
    // Dead config that looks identical to live config in a flat list.
    const retired = flattenAgents(TEAMS).find((r) => r.agentId === 'retired')!;
    expect(retired.orphaned).toBe(true);
    expect(promptWarnings(retired)).toContainEqual(expect.stringContaining('changes nothing'));
  });

  it('keys rows by team so one agent id in two teams is two rows', () => {
    const rows = flattenAgents({
      a: { team: { name: 'alpha' }, agents: [{ id: 'writer' }] },
      b: { team: { name: 'beta' }, agents: [{ id: 'writer' }] },
    });
    expect(new Set(rows.map((r) => r.key)).size).toBe(2);
  });

  it('skips an agent with no identifier rather than rendering a blank row', () => {
    expect(flattenAgents({ a: { agents: [{ goal_template: 'x' }] } })).toEqual([]);
  });
});

describe('the prompt preview', () => {
  const row = flattenAgents(TEAMS).find((r) => r.agentId === 'director')!;

  it('shows the prompt inside the envelope the orchestrator adds', () => {
    // goal_template is one block in a larger prompt. Editing it without
    // seeing the envelope is the commonest way a prompt change surprises its
    // author.
    const preview = composePromptPreview(row, VISIBILITY);
    expect(preview).toContain('ROLE: Content Marketing Director');
    expect(preview).toContain('TEAM_NORTH_STAR: Grow reach');
    expect(preview).toContain('STEP_GOAL:\nSet the angle.');
    expect(preview).toContain('OUTPUT CONTRACT:');
    // The heading without the lines under it is a preview that omits the
    // rules the model is actually held to.
    for (const line of OUTPUT_CONTRACT_LINES) {
      expect(preview).toContain(line);
    }
  });

  it('includes the team hard constraints, which also bind the agent', () => {
    const preview = composePromptPreview(row, VISIBILITY);
    expect(preview).toContain('- No hype');
    expect(preview).toContain('- Cite sources');
  });

  it('marks the sections filled at run time rather than omitting them', () => {
    // Omitting them would imply the prompt ends there.
    const preview = composePromptPreview(row, VISIBILITY);
    expect(preview).toContain('RAG_CONTEXT: «filled at run time»');
  });

  it('matches the envelope prompt_builder.py actually emits', () => {
    /* A preview that paraphrases is worse than none: it teaches the wrong
     * thing about what the model receives. This reads the Python source so
     * the two cannot drift silently. */
    const builder = readFileSync(
      join(__dirname, '..', '..', 'TeamWeave', 'src', 'orchestrator', 'prompt_builder.py'),
      'utf8',
    );
    for (const line of OUTPUT_CONTRACT_LINES) {
      expect(builder).toContain(line);
    }
    expect(builder).toContain('ROLE: {agent.name}');
    expect(builder).toContain('TEAM_NORTH_STAR: {team.globals.north_star}');
    expect(builder).toContain('"STEP_GOAL:"');
    expect(builder).toContain('"HARD_CONSTRAINTS:"');
  });
});

describe('saving a prompt', () => {
  it('writes to the team document the orchestrator reads', () => {
    const next = withUpdatedPrompt(VISIBILITY, 'writer', 'Draft it, briefly.');
    expect(next.agents!.find((a) => a.id === 'writer')!.goal_template).toBe('Draft it, briefly.');
  });

  it('leaves every other agent untouched', () => {
    const next = withUpdatedPrompt(VISIBILITY, 'writer', 'changed');
    expect(next.agents!.find((a) => a.id === 'director')!.goal_template).toBe('Set the angle.');
  });

  it('carries through fields this surface does not own', () => {
    // The tab owns prompts. Anything it does not understand belongs to
    // whoever wrote it, and dropping it would be a silent deletion.
    const next = withUpdatedPrompt(VISIBILITY, 'director', 'new');
    const director = next.agents!.find((a) => a.id === 'director')!;
    expect(director.schema_ref).toBe('creative_brief_v1');
    expect(director.bedrock!.model_id).toBe('us.amazon.nova-micro-v1:0');
    expect(next.workflow).toEqual(VISIBILITY.workflow);
  });

  it('does not mutate the document it was given', () => {
    withUpdatedPrompt(VISIBILITY, 'writer', 'mutated?');
    expect(VISIBILITY.agents!.find((a) => a.id === 'writer')!.goal_template).toBe('Draft it.');
  });

  it('is a no-op when the prompt did not change', () => {
    // So an unedited save does not rewrite every team config in S3.
    expect(withUpdatedPrompt(VISIBILITY, 'writer', 'Draft it.')).toBe(VISIBILITY);
  });

  it('is a no-op for an agent the team does not have', () => {
    expect(withUpdatedPrompt(VISIBILITY, 'ghost', 'x')).toBe(VISIBILITY);
  });
});

describe('warnings that explain a prompt that will not behave', () => {
  const rowFor = (agent: Record<string, unknown>) =>
    flattenAgents({ a: { team: { name: 't' }, agents: [agent], workflow: [{ step: 'x' }] } })[0];

  it('names an empty prompt', () => {
    expect(promptWarnings(rowFor({ id: 'x', goal_template: '' })))
      .toContainEqual(expect.stringContaining('empty STEP_GOAL'));
  });

  it('warns when markdown fights the output contract', () => {
    expect(promptWarnings(rowFor({ id: 'x', goal_template: '# Heading\nDo it.' })))
      .toContainEqual(expect.stringContaining('markdown'));
  });

  it('says nothing about a prompt that is fine', () => {
    expect(promptWarnings(rowFor({ id: 'x', goal_template: 'Write the post.' }))).toEqual([]);
  });
});


describe('the tab shows the agents that run', () => {
  const read = (rel: string) => readFileSync(join(__dirname, '..', rel), 'utf8');

  it('sources agents from the team configs, not from /agents', () => {
    // /agents is Bedrock Agents Classic. TeamWeave runs on AgentCore and
    // Classic provisioning is skipped every deploy, so that list is resources
    // nothing invokes.
    const tab = read('components/admin/agent-management/agents/AgentPromptsTab.tsx');
    expect(tab).toContain("apiFetch<TeamsResponse>('/teams')");
    expect(tab).not.toContain("apiFetch<GetAgentsResponse>('/agents')");
  });

  it('saves a prompt to the team config the orchestrator reads', () => {
    const tab = read('components/admin/agent-management/agents/AgentPromptsTab.tsx');
    expect(tab).toContain('withUpdatedPrompt');
    expect(tab).toContain("method: 'PUT'");
    expect(tab).toContain('/teams/');
  });

  it('does not promise a write that has only been accepted', () => {
    /* Provisioning writes return 202 and nothing has happened yet. The old
     * tab said "Agent updated" for a Classic edit that changed nothing any
     * run reads; saying it here would repeat the same lie in a new place. */
    const tab = read('components/admin/agent-management/agents/AgentPromptsTab.tsx');
    expect(tab).toContain('accepted');
    expect(tab).not.toContain("onSuccess('Prompt updated')");
  });

  it('keeps the legacy Bedrock view but says what it is', () => {
    const shell = read('components/admin/agent-management/AgentManagementTab.tsx');
    expect(shell).toContain('AgentPromptsTab');
    expect(shell).toContain('Bedrock (legacy)');
    const legacy = read('components/admin/agent-management/agents/AgentList.tsx');
    expect(legacy).toContain('Nothing invokes them');
  });

  it('shows the prompt envelope beside the editor', () => {
    const drawer = read('components/admin/agent-management/agents/PromptEditorDrawer.tsx');
    expect(drawer).toContain('What the model actually receives');
    expect(drawer).toContain('preview.replace(row.prompt, draft)');
  });
});
