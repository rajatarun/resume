/**
 * Which substrate an agent runs on, and what the console should say about it.
 *
 * TeamWeave moved from Bedrock Agents Classic to AgentCore. Classic gave every
 * agent an `agentId` and an `aliasId`, because an agent's identity lived in
 * the Bedrock agent resource. AgentCore does not work that way: one runtime
 * serves every agent and its ARN is a stack-level value, so those two fields
 * are simply blank now.
 *
 * The console read them as the agent's identity and as the precondition for
 * chatting with it. So the switch showed up here as an agent list reading
 * `name · role · — · —` and a Chat button greyed out on every row, with
 * nothing anywhere saying why. This module is the one place that decides what
 * an agent's coordinates are, so a third substrate is a change here rather
 * than in every component that renders an agent.
 */

/** The agent shape as it arrives in a team's `team.json`. */
export type TeamAgent = {
  name?: string;
  role_id?: string;
  bedrock?: {
    agentId?: string;
    aliasId?: string;
    runtimeArn?: string;
    qualifier?: string;
  };
  agentId?: string;
  aliasId?: string;
  runtimeArn?: string;
  qualifier?: string;
};

export type AgentSubstrate = {
  /**
   * `agentcore` when the agent names its own runtime, `classic` when it
   * carries the Bedrock pair, and `stack` when it names neither — which is
   * the normal case, not an error: the stack's own AgentCore runtime serves
   * it.
   */
  kind: 'agentcore' | 'classic' | 'stack';
  /** Short label for a badge. */
  label: string;
  /** The coordinates worth showing, already formatted. Empty when there are none. */
  detail: string;
  /** Longer text for a title attribute — why `detail` reads the way it does. */
  hint: string;
  /** The agent coordinates to put in a POST /agent/converse body. */
  converseFields: {
    agent_id?: string;
    alias_id?: string;
    runtime_arn?: string;
    qualifier?: string;
  };
};

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

/** An ARN is too long for a list row; its last segment is what identifies it. */
export function shortenArn(arn: string): string {
  const tail = arn.split('/').pop() ?? arn;
  return tail || arn;
}

export function resolveAgentSubstrate(agent: TeamAgent): AgentSubstrate {
  const runtimeArn = firstNonEmpty(agent.bedrock?.runtimeArn, agent.runtimeArn);
  const qualifier = firstNonEmpty(agent.bedrock?.qualifier, agent.qualifier);
  const agentId = firstNonEmpty(agent.bedrock?.agentId, agent.agentId);
  const aliasId = firstNonEmpty(agent.bedrock?.aliasId, agent.aliasId);

  // A dedicated runtime wins: an agent that names one is pinned to it even on
  // a stack whose default runtime would also have served it.
  if (runtimeArn) {
    return {
      kind: 'agentcore',
      label: 'AgentCore',
      detail: qualifier ? `${shortenArn(runtimeArn)} · ${qualifier}` : shortenArn(runtimeArn),
      hint: `Own AgentCore runtime: ${runtimeArn}${qualifier ? ` (qualifier ${qualifier})` : ''}`,
      converseFields: qualifier ? { runtime_arn: runtimeArn, qualifier } : { runtime_arn: runtimeArn },
    };
  }

  // Both ids, or neither. One without the other cannot address a Classic
  // agent, so it is not evidence that this is one.
  if (agentId && aliasId) {
    return {
      kind: 'classic',
      label: 'Classic',
      detail: `${agentId} · ${aliasId}`,
      hint:
        'Bedrock Agents Classic. Classic is in maintenance mode — its model ' +
        'catalogue is frozen and it takes no new features.',
      converseFields: { agent_id: agentId, alias_id: aliasId },
    };
  }

  return {
    kind: 'stack',
    label: 'Stack runtime',
    detail: '',
    hint:
      'Served by the stack AgentCore runtime. One runtime serves every agent, ' +
      'so an agent needs no coordinates of its own — the role and step goal ' +
      'travel with each request.',
    converseFields: {},
  };
}

/**
 * Whether the console can start a conversation with this agent.
 *
 * Always true, and that is the fix rather than an oversight: the old check
 * required a Classic agentId and aliasId, which every AgentCore agent lacks.
 * Whether the deployed stack can actually serve the turn is the API's to
 * answer — it validates against the substrate it is running and returns a 400
 * that names what is missing. Guessing that here is what produced a disabled
 * button with no explanation.
 */
export function canConverse(_agent: TeamAgent): boolean {
  return true;
}
