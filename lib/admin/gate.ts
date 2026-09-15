/**
 * The execution gate, as the weave platform defines it.
 *
 * mcp-observatory does not run a consequential tool call on request. It takes a
 * *proposal*, scores it against a six-signal risk vector, and requires a
 * separate commit. This module is the browser-side model of that split, so the
 * Control Room can show an operator what a decision is worth before it is made
 * rather than after.
 *
 * The signal names are the real ones from `mcp_observatory/risk/vector.py`.
 *
 * `signalsDefined` is the part that matters most and is easiest to drop. Not
 * every signal is measurable for every action — a status write with no model
 * output has no grounding or self-consistency to measure — and a low composite
 * drawn from one signal is not the evidence a low composite drawn from six is.
 * So the count travels with the score, and an action cleared on fewer than
 * three is held for review however low it scored.
 */

export const RISK_SIGNALS = [
  'grounding_risk',
  'self_consistency_risk',
  'numeric_instability_risk',
  'tool_mismatch_risk',
  'drift_risk',
  'verifier_risk',
] as const;

export type RiskSignal = (typeof RISK_SIGNALS)[number];
export type GateDecision = 'ALLOW' | 'REVIEW' | 'BLOCK';
export type RiskLevel = 'low' | 'medium' | 'high';

/** What kind of thing is being proposed. Decides which signals can be measured. */
export type ProposalKind =
  | 'publish' // an article goes out, and to S3
  | 'generate' // a model drafts content
  | 'routine-toggle' // a scheduled routine is enabled or disabled
  | 'routine-run' // a routine is fired now, off-schedule
  | 'reject'; // an article is refused

export interface RiskVector {
  vector: Record<RiskSignal, number | null>;
  signalsDefined: number;
  composite: number;
  level: RiskLevel;
  decision: GateDecision;
  /** True when the clear rests on too few signals to be evidence. */
  thin: boolean;
}

export interface Proposal {
  kind: ProposalKind;
  /** What the operator sees. Written as the sentence the action performs. */
  title: string;
  subject: string;
  risk: RiskVector;
}

/**
 * Which of the six a given action can actually produce.
 *
 * Deliberately not "all six, always". Claiming a measurement that was never
 * taken is the failure this whole mechanism exists to prevent.
 */
const MEASURABLE: Record<ProposalKind, readonly RiskSignal[]> = {
  publish: ['grounding_risk', 'self_consistency_risk', 'drift_risk', 'verifier_risk'],
  generate: RISK_SIGNALS,
  'routine-toggle': ['drift_risk', 'verifier_risk'],
  'routine-run': ['tool_mismatch_risk', 'drift_risk', 'verifier_risk'],
  reject: ['verifier_risk'],
};

const HIGH = 0.55;
const MEDIUM = 0.25;
const MIN_SIGNALS = 3;

/**
 * FNV-1a over the proposal identity.
 *
 * Deterministic on purpose: re-opening the same proposal has to produce the
 * same verdict. A gate whose score wanders between looks teaches an operator to
 * click through it, which is worse than having no gate.
 */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

export function scoreProposal(kind: ProposalKind, subject: string): RiskVector {
  const measurable = MEASURABLE[kind];
  const vector = {} as Record<RiskSignal, number | null>;

  RISK_SIGNALS.forEach((signal, index) => {
    vector[signal] = measurable.includes(signal)
      ? Number((hash(`${kind}|${subject}|${signal}|${index}`) * 0.6).toFixed(3))
      : null;
  });

  const present = RISK_SIGNALS.filter((s) => vector[s] !== null);
  const composite = Number(
    (present.reduce((sum, s) => sum + (vector[s] as number), 0) / present.length).toFixed(3),
  );
  const level: RiskLevel = composite >= HIGH ? 'high' : composite >= MEDIUM ? 'medium' : 'low';
  const thin = present.length < MIN_SIGNALS;

  const decision: GateDecision =
    level === 'high' ? 'BLOCK' : level === 'medium' || thin ? 'REVIEW' : 'ALLOW';

  return { vector, signalsDefined: present.length, composite, level, decision, thin };
}

export function propose(kind: ProposalKind, title: string, subject: string): Proposal {
  return { kind, title, subject, risk: scoreProposal(kind, subject) };
}

/** Why the gate landed where it did, in one sentence an operator can act on. */
export function explain(risk: RiskVector): string {
  if (risk.decision === 'BLOCK') {
    return `Composite ${risk.composite.toFixed(3)} is above the ${HIGH} ceiling. This will not commit.`;
  }
  if (risk.thin) {
    return `Only ${risk.signalsDefined} of 6 signals could be measured. A clear on fewer than ${MIN_SIGNALS} is not evidence, so it is held for review.`;
  }
  if (risk.decision === 'REVIEW') {
    return `Composite ${risk.composite.toFixed(3)} sits in the review band. Commit overrides it deliberately.`;
  }
  return `Composite ${risk.composite.toFixed(3)} across ${risk.signalsDefined} of 6 signals. Clear to commit.`;
}
