/**
 * Unit tests for Observatory filtering logic.
 *
 * Fixture data comes directly from the real API response and DynamoDB scan
 * provided by the user. Tests reproduce the reported bugs:
 *   1. total showing as 6 (invoke_agent items absent from by_operation aggregate)
 *   2. invoke_agent operation completely filtered out in the UI
 *   3. decision case mismatch (invoke_agent returns lowercase "allow")
 *   4. classify_question / synthesize_answer items silently excluded
 */

import {
  computeOperationBreakdown,
  buildOperationGroups,
  mergeOperationGroups,
  findMissingOperations,
  computeTotalsFromGroups,
  computeTotalsFromItems,
  normalizeDecision,
  decisionMatches,
  aggregateGroupsByStringKey,
  computeRiskMetricsFromItems,
} from '@/components/admin/agent-management/shared/observabilityUtils';
import type { SpanItem, AggregateGroup } from '@/components/admin/agent-management/shared/observabilityFetch';

// ─── Fixture: real API list response (subset matching the DynamoDB scan) ──────

const API_ITEMS: SpanItem[] = [
  // invoke_model items (10 total)
  { trace_id: '0c914304-3c2d-4ded-91c8-df2c47a5d0bc', operation: 'invoke_model', timestamp: '2026-03-30T20:19:59.737735', model_id: 'us.amazon.nova-pro-v1:0', decision: 'allow', cost_usd: 0.009104, prompt_tokens: 2568, completion_tokens: 992, composite_risk_level: 'low', hallucination_risk_level: 'medium' },
  { trace_id: 'ce239d13-9040-4b7e-91fd-ae4fe6e38bc5', operation: 'invoke_model', timestamp: '2026-03-30T20:19:53.460595', model_id: 'amazon.titan-embed-text-v2:0', decision: 'allow', cost_usd: 0.00057, prompt_tokens: 37, completion_tokens: 124, composite_risk_level: 'low', hallucination_risk_level: 'medium' },
  { trace_id: '72b4c0ea-75a3-47c2-aaf4-e5bb73f4461d', operation: 'invoke_model', timestamp: '2026-03-30T20:19:45.266601', model_id: 'amazon.nova-micro-v1:0', decision: 'allow', cost_usd: 0.000542, prompt_tokens: 23, completion_tokens: 124, composite_risk_level: 'low', hallucination_risk_level: 'medium' },
  { trace_id: '58f7aceb-a0ca-4971-9eff-839635cc757f', operation: 'invoke_model', timestamp: '2026-03-30T19:39:43.879881', model_id: 'us.amazon.nova-pro-v1:0', decision: 'allow', cost_usd: 0.004474, prompt_tokens: 775, completion_tokens: 731, composite_risk_level: 'low', hallucination_risk_level: 'medium' },
  { trace_id: '355e8ae8-1284-4b69-a305-0838312b8bdc', operation: 'invoke_model', timestamp: '2026-03-30T19:39:38.358753', model_id: 'amazon.titan-embed-text-v2:0', decision: 'allow', cost_usd: 0.00057, prompt_tokens: 37, completion_tokens: 124, composite_risk_level: 'low', hallucination_risk_level: 'medium' },
  { trace_id: '15be86c9-dccc-4bbd-9a8c-e5c8cbf90d99', operation: 'invoke_model', timestamp: '2026-03-30T19:39:30.005896', model_id: 'amazon.nova-micro-v1:0', decision: 'allow', cost_usd: 0.000546, prompt_tokens: 23, completion_tokens: 125, composite_risk_level: 'low', hallucination_risk_level: 'medium' },
  { trace_id: '91bd6cae-e1ef-460e-bd15-39cad0bff26f', operation: 'invoke_model', timestamp: '2026-03-30T18:04:46.104455', model_id: 'us.amazon.nova-pro-v1:0', decision: 'allow', cost_usd: 0.004018, prompt_tokens: 775, completion_tokens: 617 },
  { trace_id: '910958cd-3319-40f5-acbf-132914b58800', operation: 'invoke_model', timestamp: '2026-03-30T18:04:41.858847', model_id: 'amazon.titan-embed-text-v2:0', decision: 'allow', cost_usd: 0.00057, prompt_tokens: 37, completion_tokens: 124 },
  { trace_id: 'f3904cf1-293f-4d67-bac8-ece27ea5d3d8', operation: 'invoke_model', timestamp: '2026-03-30T18:04:33.668207', model_id: 'amazon.nova-micro-v1:0', decision: 'allow', cost_usd: 0.000546, prompt_tokens: 23, completion_tokens: 125 },
  { trace_id: '07af6ecf-8e3c-408b-9aad-a248379b2918', operation: 'invoke_model', timestamp: '2026-03-30T13:40:11.156420', model_id: 'amazon.titan-embed-text-v2:0', decision: 'allow', cost_usd: 0.00057, prompt_tokens: 37, completion_tokens: 124 },

  // invoke_agent items (6 total) — decision is LOWERCASE "allow", no model_id
  { trace_id: 'e196bf07-f800-4394-bdb2-53a3e88538a7', operation: 'invoke_agent', timestamp: '2026-03-30T19:52:45.733568', agent_id: 'M4L7CB3SDV', decision: 'allow', cost_usd: 0.008834, prompt_tokens: 4107, completion_tokens: 155, risk_tier: 'high', composite_risk_level: 'high', hallucination_risk_level: 'high', policy_decision: 'allow' },
  { trace_id: 'c79d1034-cb6c-45a7-af79-41996a73aad9', operation: 'invoke_agent', timestamp: '2026-03-30T19:52:24.997872', agent_id: '04PEAR5QXH', decision: 'allow', cost_usd: 0.008016, prompt_tokens: 3698, completion_tokens: 155, risk_tier: 'high', composite_risk_level: 'high', hallucination_risk_level: 'high', policy_decision: 'allow' },
  { trace_id: '85371e66-a3ca-4211-80ff-b68420a4d3dd', operation: 'invoke_agent', timestamp: '2026-03-30T19:52:13.028915', agent_id: 'XETTRDNTXW', decision: 'allow', cost_usd: 0.007694, prompt_tokens: 3537, completion_tokens: 155, risk_tier: 'high', composite_risk_level: 'high', hallucination_risk_level: 'high', policy_decision: 'allow' },
  { trace_id: '0dc8c147-da46-45e4-a109-48ce878e0e9d', operation: 'invoke_agent', timestamp: '2026-03-30T19:51:50.768392', agent_id: 'G8YXCG3JA8', decision: 'allow', cost_usd: 0.008142, prompt_tokens: 3761, completion_tokens: 155, risk_tier: 'high', composite_risk_level: 'high', hallucination_risk_level: 'high', policy_decision: 'allow' },
  { trace_id: '32a288f1-1ef1-4821-ad7d-5aeaff604758', operation: 'invoke_agent', timestamp: '2026-03-30T19:51:14.637780', agent_id: 'LGHHJKQ2SP', decision: 'allow', cost_usd: 0.007126, prompt_tokens: 3253, completion_tokens: 155, risk_tier: 'high', composite_risk_level: 'high', hallucination_risk_level: 'high', policy_decision: 'allow' },
  { trace_id: 'b82c7d4c-2b7b-44ea-9697-84cc3056606b', operation: 'invoke_agent', timestamp: '2026-03-30T19:51:04.501539', agent_id: 'Z18ZMFO4WF', decision: 'allow', cost_usd: 0.004338, prompt_tokens: 1859, completion_tokens: 155, risk_tier: 'high', composite_risk_level: 'high', hallucination_risk_level: 'high', policy_decision: 'allow' },

  // classify_question items (4 total) — legacy pk = OBSERVATORY#classify_question
  { trace_id: 'fcb9fe3b-9147-4c58-9b32-9e6928fd432f', operation: 'classify_question', timestamp: '2026-03-30T13:40:02.818688', model_id: 'amazon.nova-micro-v1:0', decision: 'allow', cost_usd: 0.000546, prompt_tokens: 23, completion_tokens: 125 },
  { trace_id: '80f881c1-af09-47fd-98d1-5afa713056bf', operation: 'classify_question', timestamp: '2026-03-30T13:32:20.468610', model_id: 'amazon.nova-micro-v1:0', decision: 'allow', cost_usd: 0.000544, prompt_tokens: 24, completion_tokens: 124 },
  { trace_id: 'ade33e92-7a9e-4b91-9930-0628cd14984c', operation: 'classify_question', timestamp: '2026-03-30T13:22:58.726373', model_id: 'amazon.nova-micro-v1:0', decision: 'allow', cost_usd: 0.000554, prompt_tokens: 29, completion_tokens: 124 },
  { trace_id: '20db879a-91d7-4a71-bd83-ac0fc404f559', operation: 'classify_question', timestamp: '2026-03-30T13:22:37.393561', model_id: 'amazon.nova-micro-v1:0', decision: 'allow', cost_usd: 0.000546, prompt_tokens: 23, completion_tokens: 125 },

  // synthesize_answer item (1 total) — legacy pk = OBSERVATORY#synthesize_answer
  { trace_id: 'a82251b0-54d2-46f8-9b69-7480661b3e61', operation: 'synthesize_answer', timestamp: '2026-03-30T13:40:16.262356', model_id: 'us.amazon.nova-pro-v1:0', decision: 'allow', cost_usd: 0.00253, prompt_tokens: 41, completion_tokens: 612 },
];

// ─── Simulated backend aggregate (reproduces the bug) ────────────────────────
// The backend by_operation aggregate only queries OBSERVATORY#invoke_model
// partition, so invoke_agent, classify_question, synthesize_answer are absent.
const BUGGY_BY_OPERATION_GROUPS: AggregateGroup[] = [
  { key: { operation: 'invoke_model' }, count: 6 }, // only 6 of the 10 items visible
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('computeOperationBreakdown', () => {
  it('counts all operation types from the item list', () => {
    const breakdown = computeOperationBreakdown(API_ITEMS);
    expect(breakdown['invoke_model']).toBe(10);
    expect(breakdown['invoke_agent']).toBe(6);
    expect(breakdown['classify_question']).toBe(4);
    expect(breakdown['synthesize_answer']).toBe(1);
  });

  it('total items equals sum of all operation counts', () => {
    const breakdown = computeOperationBreakdown(API_ITEMS);
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    expect(total).toBe(21); // 10 + 6 + 4 + 1
  });

  it('returns empty object for empty items', () => {
    expect(computeOperationBreakdown([])).toEqual({});
  });

  it('handles items with no operation field as "unknown"', () => {
    const items: SpanItem[] = [
      { trace_id: 'x', timestamp: '2026-01-01', operation: undefined as unknown as string },
    ];
    expect(computeOperationBreakdown(items)['unknown']).toBe(1);
  });
});

describe('buildOperationGroups', () => {
  it('builds groups that include invoke_agent — fixing the missing invoke_agent bug', () => {
    const groups = buildOperationGroups(API_ITEMS);
    const ops = groups.map((g) => g.key.operation);
    expect(ops).toContain('invoke_agent');
    expect(ops).toContain('invoke_model');
    expect(ops).toContain('classify_question');
    expect(ops).toContain('synthesize_answer');
  });

  it('counts invoke_agent items correctly (6, not 0)', () => {
    const groups = buildOperationGroups(API_ITEMS);
    const agentGroup = groups.find((g) => g.key.operation === 'invoke_agent');
    expect(agentGroup).toBeDefined();
    expect(agentGroup!.count).toBe(6);
  });

  it('counts invoke_model items correctly (10)', () => {
    const groups = buildOperationGroups(API_ITEMS);
    const modelGroup = groups.find((g) => g.key.operation === 'invoke_model');
    expect(modelGroup).toBeDefined();
    expect(modelGroup!.count).toBe(10);
  });

  it('sum of all group counts equals total item count', () => {
    const groups = buildOperationGroups(API_ITEMS);
    const total = groups.reduce((s, g) => s + g.count, 0);
    expect(total).toBe(API_ITEMS.length); // 21
  });
});

describe('findMissingOperations — reproduces the invoke_agent filtered out bug', () => {
  it('detects that buggy aggregate is missing invoke_agent', () => {
    const missing = findMissingOperations(BUGGY_BY_OPERATION_GROUPS);
    expect(missing).toContain('invoke_agent');
  });

  it('detects that buggy aggregate is missing classify_question and synthesize_answer', () => {
    const missing = findMissingOperations(BUGGY_BY_OPERATION_GROUPS);
    expect(missing).toContain('classify_question');
    expect(missing).toContain('synthesize_answer');
  });

  it('returns empty when all known operations present', () => {
    const complete: AggregateGroup[] = [
      { key: { operation: 'invoke_agent' }, count: 6 },
      { key: { operation: 'invoke_model' }, count: 10 },
      { key: { operation: 'classify_question' }, count: 4 },
      { key: { operation: 'synthesize_answer' }, count: 1 },
    ];
    expect(findMissingOperations(complete)).toHaveLength(0);
  });
});

describe('mergeOperationGroups — fix by combining buggy aggregate with item-computed groups', () => {
  it('fills in missing invoke_agent from item-computed groups', () => {
    const itemGroups = buildOperationGroups(API_ITEMS);
    const merged = mergeOperationGroups(BUGGY_BY_OPERATION_GROUPS, itemGroups);
    const agentGroup = merged.find((g) => g.key.operation === 'invoke_agent');
    expect(agentGroup).toBeDefined();
    expect(agentGroup!.count).toBeGreaterThan(0);
  });

  it('does not double-count invoke_model when both sources have it', () => {
    const secondaryGroups: AggregateGroup[] = [
      { key: { operation: 'invoke_model' }, count: 4 },
      { key: { operation: 'invoke_agent' }, count: 6 },
    ];
    const merged = mergeOperationGroups(BUGGY_BY_OPERATION_GROUPS, secondaryGroups);
    const modelGroup = merged.find((g) => g.key.operation === 'invoke_model');
    // primary has 6, secondary has 4 — merged should sum to 10
    expect(modelGroup!.count).toBe(10);
  });

  it('merged total count is higher than the buggy-only total', () => {
    const buggyTotal = computeTotalsFromGroups(BUGGY_BY_OPERATION_GROUPS).count;
    const itemGroups = buildOperationGroups(API_ITEMS);
    const merged = mergeOperationGroups(BUGGY_BY_OPERATION_GROUPS, itemGroups);
    const mergedTotal = computeTotalsFromGroups(merged).count;
    expect(mergedTotal).toBeGreaterThan(buggyTotal); // 21 > 6
  });
});

describe('computeTotalsFromGroups', () => {
  it('shows total of 6 when only invoke_model group present — reproduces the reported bug', () => {
    const totals = computeTotalsFromGroups(BUGGY_BY_OPERATION_GROUPS);
    // This is the bug: user sees "6 Total Invocations" when there are actually 21
    expect(totals.count).toBe(6);
  });

  it('shows correct total of 21 when all groups present', () => {
    const groups = buildOperationGroups(API_ITEMS);
    const totals = computeTotalsFromGroups(groups);
    expect(totals.count).toBe(21);
  });
});

describe('computeTotalsFromItems', () => {
  it('computes correct total cost across all items', () => {
    const totals = computeTotalsFromItems(API_ITEMS);
    expect(totals.count).toBe(21);
    // Rough cost check — sum all item costs
    const expectedCost = API_ITEMS.reduce((s, i) => s + (i.cost_usd ?? 0), 0);
    expect(totals.cost).toBeCloseTo(expectedCost, 6);
  });
});

describe('normalizeDecision — fix for case mismatch bug', () => {
  it('normalizes lowercase "allow" (invoke_agent format) to "ALLOW"', () => {
    expect(normalizeDecision('allow')).toBe('ALLOW');
  });

  it('keeps uppercase "ALLOW" as "ALLOW"', () => {
    expect(normalizeDecision('ALLOW')).toBe('ALLOW');
  });

  it('normalizes "deny" to "DENY"', () => {
    expect(normalizeDecision('deny')).toBe('DENY');
  });

  it('returns undefined for undefined input', () => {
    expect(normalizeDecision(undefined)).toBeUndefined();
  });
});

describe('decisionMatches — case-insensitive decision filtering', () => {
  it('matches invoke_agent "allow" against "ALLOW" filter', () => {
    expect(decisionMatches('allow', 'ALLOW')).toBe(true);
  });

  it('matches "ALLOW" against "allow" filter', () => {
    expect(decisionMatches('ALLOW', 'allow')).toBe(true);
  });

  it('returns true when no filter set', () => {
    expect(decisionMatches('allow', undefined)).toBe(true);
  });

  it('does not match "allow" against "DENY"', () => {
    expect(decisionMatches('allow', 'DENY')).toBe(false);
  });

  it('all 6 invoke_agent items match an "allow" filter', () => {
    const agentItems = API_ITEMS.filter((i) => i.operation === 'invoke_agent');
    expect(agentItems).toHaveLength(6);
    const matched = agentItems.filter((i) => decisionMatches(i.decision, 'ALLOW'));
    expect(matched).toHaveLength(6); // previously 0 because of case bug
  });

  it('all 10 invoke_model items match an "allow" filter', () => {
    const modelItems = API_ITEMS.filter((i) => i.operation === 'invoke_model');
    const matched = modelItems.filter((i) => decisionMatches(i.decision, 'ALLOW'));
    expect(matched).toHaveLength(10);
  });
});

describe('invoke_agent specific field presence', () => {
  const agentItems = API_ITEMS.filter((i) => i.operation === 'invoke_agent');

  it('invoke_agent items have no model_id field', () => {
    agentItems.forEach((item) => {
      expect(item.model_id).toBeUndefined();
    });
  });

  it('invoke_agent items have agent_id field', () => {
    agentItems.forEach((item) => {
      expect(item.agent_id).toBeDefined();
    });
  });

  it('invoke_agent items have lowercase decision', () => {
    agentItems.forEach((item) => {
      expect(item.decision).toBe('allow'); // lowercase — this is the source of the bug
    });
  });

  it('invoke_agent items have risk_tier set', () => {
    agentItems.forEach((item) => {
      expect(item.risk_tier).toBe('high');
    });
  });
});

describe('aggregateGroupsByStringKey', () => {
  it('ignores groups with missing/blank risk values when aggregating', () => {
    const groups: AggregateGroup[] = [
      { key: { composite_risk_level: 'high' }, count: 3 },
      { key: { composite_risk_level: 'high' }, count: 2 },
      { key: { composite_risk_level: 'low' }, count: 4 },
      { key: { composite_risk_level: '' }, count: 7 },
      { key: {}, count: 6 },
    ];

    const aggregated = aggregateGroupsByStringKey(groups, 'composite_risk_level');
    expect(aggregated).toEqual(
      expect.arrayContaining([
        { key: 'high', count: 5 },
        { key: 'low', count: 4 },
      ]),
    );
    expect(aggregated.find((g) => g.key === '')).toBeUndefined();
    expect(aggregated).toHaveLength(2);
  });
});

describe('computeRiskMetricsFromItems — ignore items without risk fields', () => {
  it('returns null averages when no items have risk score fields', () => {
    // classify_question and synthesize_answer items have no risk scores
    const legacyItems = API_ITEMS.filter(
      (i) => i.operation === 'classify_question' || i.operation === 'synthesize_answer',
    );
    const metrics = computeRiskMetricsFromItems(legacyItems);
    expect(metrics.avg_composite_risk_score).toBeNull();
    expect(metrics.avg_hallucination_risk_score).toBeNull();
    expect(metrics.avg_shadow_disagreement_score).toBeNull();
    expect(metrics.avg_shadow_numeric_variance).toBeNull();
  });

  it('averages only items that have the field — older records do not dilute scores', () => {
    const mixedItems: SpanItem[] = [
      { trace_id: 'a', operation: 'invoke_model', timestamp: '2026-01-01', composite_risk_score: 0.8 },
      { trace_id: 'b', operation: 'invoke_model', timestamp: '2026-01-01', composite_risk_score: 0.4 },
      // older record — no composite_risk_score; must be excluded from the average
      { trace_id: 'c', operation: 'invoke_model', timestamp: '2026-01-01' },
    ];
    const metrics = computeRiskMetricsFromItems(mixedItems);
    // Average of [0.8, 0.4] = 0.6, NOT (0.8 + 0.4 + 0) / 3 = 0.4
    expect(metrics.avg_composite_risk_score).toBeCloseTo(0.6);
  });

  it('computes independent averages per field (a record missing one field still counts for others)', () => {
    const items: SpanItem[] = [
      { trace_id: 'a', operation: 'invoke_agent', timestamp: '2026-01-01', composite_risk_score: 0.9, hallucination_risk_score: 0.3 },
      { trace_id: 'b', operation: 'invoke_agent', timestamp: '2026-01-01', composite_risk_score: 0.5 /* no hallucination_risk_score */ },
      { trace_id: 'c', operation: 'invoke_agent', timestamp: '2026-01-01', hallucination_risk_score: 0.7 /* no composite_risk_score */ },
    ];
    const metrics = computeRiskMetricsFromItems(items);
    // composite: average of [0.9, 0.5] (item c excluded) = 0.7
    expect(metrics.avg_composite_risk_score).toBeCloseTo(0.7);
    // hallucination: average of [0.3, 0.7] (item b excluded) = 0.5
    expect(metrics.avg_hallucination_risk_score).toBeCloseTo(0.5);
  });

  it('returns null for gate_blocked_rate when no items have the gate_blocked field', () => {
    const items: SpanItem[] = [
      { trace_id: 'a', operation: 'invoke_model', timestamp: '2026-01-01', composite_risk_score: 0.5 },
    ];
    const metrics = computeRiskMetricsFromItems(items);
    expect(metrics.gate_blocked_rate).toBeNull();
    expect(metrics.gate_blocked_count).toBe(0);
  });

  it('computes gate_blocked_rate only over items that have the gate_blocked field', () => {
    const items: SpanItem[] = [
      { trace_id: 'a', operation: 'invoke_agent', timestamp: '2026-01-01', gate_blocked: true },
      { trace_id: 'b', operation: 'invoke_agent', timestamp: '2026-01-01', gate_blocked: false },
      { trace_id: 'c', operation: 'invoke_agent', timestamp: '2026-01-01', gate_blocked: false },
      // older record without gate_blocked — excluded from rate denominator
      { trace_id: 'd', operation: 'invoke_model', timestamp: '2026-01-01' },
    ];
    const metrics = computeRiskMetricsFromItems(items);
    expect(metrics.gate_blocked_count).toBe(1);
    // rate = 1/3 (item d not counted in denominator)
    expect(metrics.gate_blocked_rate).toBeCloseTo(1 / 3);
  });

  it('returns null averages for shadow fields when no items have them', () => {
    const items: SpanItem[] = [
      { trace_id: 'a', operation: 'invoke_model', timestamp: '2026-01-01', composite_risk_score: 0.5 },
    ];
    const metrics = computeRiskMetricsFromItems(items);
    expect(metrics.avg_shadow_disagreement_score).toBeNull();
    expect(metrics.avg_shadow_numeric_variance).toBeNull();
  });

  it('averages shadow_disagreement_score and shadow_numeric_variance independently', () => {
    const items: SpanItem[] = [
      { trace_id: 'a', operation: 'invoke_agent', timestamp: '2026-01-01', shadow_disagreement_score: 0.2, shadow_numeric_variance: 0.05 },
      { trace_id: 'b', operation: 'invoke_agent', timestamp: '2026-01-01', shadow_disagreement_score: 0.6 /* no shadow_numeric_variance */ },
      { trace_id: 'c', operation: 'invoke_agent', timestamp: '2026-01-01' /* no shadow fields */ },
    ];
    const metrics = computeRiskMetricsFromItems(items);
    // disagreement: [0.2, 0.6] → 0.4
    expect(metrics.avg_shadow_disagreement_score).toBeCloseTo(0.4);
    // variance: [0.05] → 0.05 (only item a had it)
    expect(metrics.avg_shadow_numeric_variance).toBeCloseTo(0.05);
  });

  it('returns null for all averages given an empty item list', () => {
    const metrics = computeRiskMetricsFromItems([]);
    expect(metrics.avg_composite_risk_score).toBeNull();
    expect(metrics.avg_hallucination_risk_score).toBeNull();
    expect(metrics.avg_shadow_disagreement_score).toBeNull();
    expect(metrics.avg_shadow_numeric_variance).toBeNull();
    expect(metrics.gate_blocked_rate).toBeNull();
    expect(metrics.gate_blocked_count).toBe(0);
  });
});
