/**
 * TeamWeave agents and the system prompts that actually run them.
 *
 * The Agents tab managed Bedrock Agents Classic: it listed `/agents`, showed
 * an `instruction` field and PUT edits back to a Bedrock agent resource. None
 * of that runs. TeamWeave's substrate is AgentCore, Classic provisioning is
 * skipped on every deploy, and the twelve agents that execute live in the team
 * configs — where the system prompt is `goal_template`. Editing a prompt in
 * that tab changed a resource nothing invokes, and reported success.
 *
 * So these functions read agents from the team configs, and an edit writes
 * back to the same place the orchestrator reads from.
 */

export type TeamAgentRecord = {
  id?: string;
  name?: string;
  role_id?: string;
  department_id?: string;
  schema_ref?: string;
  goal_template?: string;
  bedrock?: { model_id?: string; runtimeArn?: string; qualifier?: string };
};

export type TeamDoc = {
  team?: { name?: string; team_id?: string };
  globals?: { north_star?: string; hard_constraints?: string[] };
  agents?: TeamAgentRecord[];
  workflow?: Array<{ step?: string; inputs?: string[] }>;
};

export type AgentRow = {
  /** Unique across teams; the same agent id may appear in more than one. */
  key: string;
  teamName: string;
  agentId: string;
  displayName: string;
  roleId: string;
  schemaRef: string;
  modelId: string;
  /** The system prompt. Empty is a real state, not a loading one. */
  prompt: string;
  /** 1-based position in the team's workflow, or 0 when no step runs it. */
  stepNumber: number;
  /** An agent defined but never stepped is dead config, and worth showing. */
  orphaned: boolean;
};

export function flattenAgents(teams: Record<string, TeamDoc>): AgentRow[] {
  const rows: AgentRow[] = [];

  for (const key of Object.keys(teams).sort()) {
    const team = teams[key];
    const teamName = String(team.team?.name ?? '').trim();
    const steps = (team.workflow ?? []).map((s) => String(s.step ?? ''));

    for (const agent of team.agents ?? []) {
      const agentId = String(agent.id ?? agent.name ?? '').trim();
      if (!agentId) continue;
      const stepIndex = steps.indexOf(agentId);
      rows.push({
        key: `${teamName}:${agentId}`,
        teamName,
        agentId,
        displayName: String(agent.name ?? agentId).trim(),
        roleId: String(agent.role_id ?? '').trim(),
        schemaRef: String(agent.schema_ref ?? '').trim(),
        modelId: String(agent.bedrock?.model_id ?? '').trim(),
        prompt: String(agent.goal_template ?? ''),
        stepNumber: stepIndex + 1,
        orphaned: stepIndex < 0,
      });
    }
  }

  // Workflow order within a team, then team name: the pipeline is the order a
  // reader thinks in. Orphans sort last because nothing runs them.
  return rows.sort((a, b) => {
    if (a.teamName !== b.teamName) return a.teamName < b.teamName ? -1 : 1;
    if (a.orphaned !== b.orphaned) return a.orphaned ? 1 : -1;
    return a.stepNumber - b.stepNumber;
  });
}

/**
 * The envelope `prompt_builder` wraps a system prompt in.
 *
 * Kept verbatim, because a preview that paraphrases is worse than none: it
 * teaches the wrong thing about what the model receives.
 * `__tests__/agentPrompts.test.ts` compares these against
 * `src/orchestrator/prompt_builder.py` so the two cannot drift.
 */
export const OUTPUT_CONTRACT_LINES = [
  'Return ONLY valid JSON. No markdown. Must match the schema for this step.',
  'Do not ask follow-up questions. If inputs are incomplete, make reasonable assumptions and continue.',
  'You are generating content — not describing what you would do. Produce the actual output.',
] as const;

/** Sections the orchestrator fills at run time, shown so their place is known. */
export const RUNTIME_SECTIONS = [
  'REQUEST',
  'DIRECTOR_BRIEF_JSON',
  'GEMINI_RESEARCH_BRIEF',
  'OWNER_PROFILE_CONTEXT',
  'RAG_CONTEXT',
] as const;

/**
 * What the model actually receives, as far as it is knowable before a run.
 *
 * `goal_template` is one block inside a larger prompt, so editing it without
 * seeing the envelope is editing blind — the commonest way a prompt change
 * does not do what its author expected.
 */
export function composePromptPreview(row: AgentRow, team: TeamDoc): string {
  const northStar = String(team.globals?.north_star ?? '').trim();
  const constraints = team.globals?.hard_constraints ?? [];
  const parts: string[] = [
    `ROLE: ${row.displayName}`,
    `TEAM_NORTH_STAR: ${northStar}`,
    '',
    'STEP_GOAL:',
    row.prompt,
    '',
    'OUTPUT CONTRACT:',
    ...OUTPUT_CONTRACT_LINES,
    '',
  ];
  if (constraints.length) {
    parts.push('HARD_CONSTRAINTS:');
    for (const c of constraints) parts.push(`- ${c}`);
    parts.push('');
  }
  for (const section of RUNTIME_SECTIONS) {
    parts.push(`${section}: «filled at run time»`);
  }
  return parts.join('\n');
}

/**
 * A team document with one agent's prompt replaced, for PUT /teams/{name}.
 *
 * Returns the original object when nothing changed, so an unedited save is a
 * no-op rather than a rewrite of every team config in S3. The rest of the
 * document is carried through untouched: this surface owns prompts, and
 * anything it does not understand belongs to whoever wrote it.
 */
export function withUpdatedPrompt(
  team: TeamDoc,
  agentId: string,
  prompt: string,
): TeamDoc {
  const agents = team.agents ?? [];
  const index = agents.findIndex((a) => String(a.id ?? a.name ?? '').trim() === agentId);
  if (index < 0) return team;
  if (String(agents[index].goal_template ?? '') === prompt) return team;

  const next = agents.slice();
  next[index] = { ...agents[index], goal_template: prompt };
  return { ...team, agents: next };
}

/** Why a prompt would not do what its author expects. Empty means no warning. */
export function promptWarnings(row: AgentRow): string[] {
  const warnings: string[] = [];
  const prompt = row.prompt.trim();

  if (!prompt) {
    warnings.push('No system prompt. The agent gets an empty STEP_GOAL and will improvise.');
  }
  if (row.schemaRef && !prompt) {
    warnings.push(`Output is validated against '${row.schemaRef}', so an empty goal will usually fail validation.`);
  }
  if (/```|^#{1,6}\s/m.test(prompt)) {
    // The contract says JSON only; a prompt written in markdown invites it back.
    warnings.push('Contains markdown. The output contract forbids markdown in the response.');
  }
  if (row.orphaned) {
    warnings.push('No workflow step runs this agent, so editing its prompt changes nothing.');
  }
  return warnings;
}
