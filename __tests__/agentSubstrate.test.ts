/**
 * TeamWeave moved from Bedrock Agents Classic to AgentCore. Classic gave each
 * agent an `agentId` and an `aliasId`; AgentCore does not — one stack runtime
 * serves every agent, so those two fields are blank.
 *
 * This console read them as the agent's identity *and* as the precondition for
 * chatting with it. The switch therefore showed up here as an agent list of
 * `name · role · — · —` rows with a greyed-out Chat button on every one, and
 * nothing anywhere saying why: no error, no request, no log. These pin the
 * decisions that made that possible, so a third substrate cannot repeat it.
 */
import {
  canConverse,
  resolveAgentSubstrate,
  shortenArn,
  type TeamAgent,
} from '@/components/admin/agent-management/shared/substrate';

const ARN = 'arn:aws:bedrock-agentcore:us-east-1:239571291755:runtime/teamweave_agent-XyZ';

describe('an agent with no coordinates of its own', () => {
  // The normal case on AgentCore, and the one the old code treated as broken.
  const agent: TeamAgent = { name: 'strategist', role_id: 'PBM-001' };

  it('is not a problem — the stack runtime serves it', () => {
    expect(resolveAgentSubstrate(agent).kind).toBe('stack');
  });

  it('can still be chatted with', () => {
    expect(canConverse(agent)).toBe(true);
  });

  it('sends no agent coordinates, leaving the API to resolve the runtime', () => {
    expect(resolveAgentSubstrate(agent).converseFields).toEqual({});
  });

  it('explains itself rather than showing an em dash', () => {
    const { detail, hint } = resolveAgentSubstrate(agent);
    expect(detail).toBe('');
    expect(hint).toMatch(/one runtime serves every agent/i);
  });
});

describe('an agent with its own AgentCore runtime', () => {
  const agent: TeamAgent = { name: 'editor', bedrock: { runtimeArn: ARN, qualifier: 'DEFAULT' } };

  it('is reported as AgentCore', () => {
    expect(resolveAgentSubstrate(agent).kind).toBe('agentcore');
  });

  it('forwards the ARN and qualifier so the stack default is not used instead', () => {
    expect(resolveAgentSubstrate(agent).converseFields).toEqual({
      runtime_arn: ARN,
      qualifier: 'DEFAULT',
    });
  });

  it('omits an absent qualifier rather than sending an empty one', () => {
    expect(resolveAgentSubstrate({ bedrock: { runtimeArn: ARN } }).converseFields).toEqual({
      runtime_arn: ARN,
    });
  });

  it('shows the ARN tail, since a full ARN does not fit a list row', () => {
    expect(resolveAgentSubstrate(agent).detail).toContain('teamweave_agent-XyZ');
    expect(resolveAgentSubstrate(agent).detail).not.toContain('arn:aws');
  });

  it('wins over Classic ids left behind by an earlier provisioning run', () => {
    const migrated: TeamAgent = { agentId: 'A1', aliasId: 'L1', runtimeArn: ARN };
    expect(resolveAgentSubstrate(migrated).kind).toBe('agentcore');
    expect(resolveAgentSubstrate(migrated).converseFields).toEqual({ runtime_arn: ARN });
  });
});

describe('an agent still on Classic', () => {
  // Classic is deprecated, not deleted: AGENT_RUNTIME=classic is the rollback,
  // and an agent deployed before the switch still carries the pair.
  const agent: TeamAgent = { name: 'legacy', bedrock: { agentId: 'A1', aliasId: 'L1' } };

  it('is reported as Classic', () => {
    expect(resolveAgentSubstrate(agent).kind).toBe('classic');
  });

  it('sends the pair the Classic substrate addresses it by', () => {
    expect(resolveAgentSubstrate(agent).converseFields).toEqual({
      agent_id: 'A1',
      alias_id: 'L1',
    });
  });

  it('says Classic is in maintenance mode, which is why it is worth noticing', () => {
    expect(resolveAgentSubstrate(agent).hint).toMatch(/maintenance mode/i);
  });

  it('reads the flat fields too, since team.json has carried both shapes', () => {
    expect(resolveAgentSubstrate({ agentId: 'A1', aliasId: 'L1' }).kind).toBe('classic');
  });

  it('is not claimed on half a pair — one id cannot address a Classic agent', () => {
    expect(resolveAgentSubstrate({ agentId: 'A1' }).kind).toBe('stack');
    expect(resolveAgentSubstrate({ aliasId: 'L1' }).kind).toBe('stack');
  });

  it('ignores a blank id rather than treating it as present', () => {
    expect(resolveAgentSubstrate({ agentId: '  ', aliasId: 'L1' }).kind).toBe('stack');
  });
});

describe('shortenArn', () => {
  it('keeps the segment that identifies the runtime', () => {
    expect(shortenArn(ARN)).toBe('teamweave_agent-XyZ');
  });

  it('leaves a value that is not an ARN alone', () => {
    expect(shortenArn('plain-name')).toBe('plain-name');
  });
});
