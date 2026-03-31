/**
 * Pure utility functions for Observatory data processing.
 * Extracted from components to make them independently testable.
 */

import { SpanItem, AggregateGroup } from './observabilityFetch';

// ─── Decision normalization ───────────────────────────────────────────────────

/**
 * Normalize a decision string to uppercase for consistent comparison.
 * The API returns lowercase "allow"/"deny"/"shadow" for invoke_agent items
 * but uppercase "ALLOW"/"DENY"/"SHADOW" is used elsewhere.
 */
export function normalizeDecision(decision?: string): string | undefined {
  if (!decision) return undefined;
  return decision.toUpperCase();
}

/**
 * Check if a span's decision matches a filter value (case-insensitive).
 */
export function decisionMatches(spanDecision?: string, filterDecision?: string): boolean {
  if (!filterDecision) return true;
  return normalizeDecision(spanDecision) === normalizeDecision(filterDecision);
}

// ─── Operation breakdown ──────────────────────────────────────────────────────

/**
 * All known operation types, including legacy ones stored under separate
 * DynamoDB partition keys (classify_question, synthesize_answer).
 */
export const KNOWN_OPERATIONS = [
  'invoke_agent',
  'invoke_model',
  'classify_question',
  'synthesize_answer',
] as const;

export type KnownOperation = (typeof KNOWN_OPERATIONS)[number];

/**
 * Compute operation → count breakdown from a flat list of span items.
 * This is used as the source-of-truth when the by_operation aggregate
 * does not include all partition keys (e.g. invoke_agent items live under
 * OBSERVATORY#invoke_agent and may be omitted from the invoke_model-only
 * aggregate path on the backend).
 */
export function computeOperationBreakdown(items: SpanItem[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  for (const item of items) {
    const op = item.operation ?? 'unknown';
    breakdown[op] = (breakdown[op] ?? 0) + 1;
  }
  return breakdown;
}

/**
 * Build synthetic AggregateGroup[] from a raw item list so that components
 * expecting aggregate data (StatsBar, OperationPieChart) work correctly even
 * when the backend aggregate misses certain operation partitions.
 */
export function buildOperationGroups(items: SpanItem[]): AggregateGroup[] {
  const costByOp: Record<string, number> = {};
  const promptByOp: Record<string, number> = {};
  const completionByOp: Record<string, number> = {};
  const countByOp: Record<string, number> = {};

  for (const item of items) {
    const op = item.operation ?? 'unknown';
    countByOp[op] = (countByOp[op] ?? 0) + 1;
    costByOp[op] = (costByOp[op] ?? 0) + (item.cost_usd ?? 0);
    promptByOp[op] = (promptByOp[op] ?? 0) + (item.prompt_tokens ?? 0);
    completionByOp[op] = (completionByOp[op] ?? 0) + (item.completion_tokens ?? 0);
  }

  return Object.keys(countByOp).map((op) => ({
    key: { operation: op },
    count: countByOp[op],
    sum_cost_usd: costByOp[op],
    sum_prompt_tokens: promptByOp[op],
    sum_completion_tokens: completionByOp[op],
  }));
}

/**
 * Merge two sets of AggregateGroup[] (e.g. from separate aggregate API calls
 * for invoke_model and invoke_agent) by summing counts and numeric fields for
 * matching keys.
 */
export function mergeOperationGroups(
  primary: AggregateGroup[],
  secondary: AggregateGroup[],
  keyField: string = 'operation',
): AggregateGroup[] {
  const map = new Map<string, AggregateGroup>();

  for (const g of [...primary, ...secondary]) {
    const k = g.key[keyField] ?? '';
    const existing = map.get(k);
    if (!existing) {
      map.set(k, { ...g });
    } else {
      map.set(k, {
        ...existing,
        count: existing.count + g.count,
        sum_cost_usd: (existing.sum_cost_usd ?? 0) + (g.sum_cost_usd ?? 0),
        sum_prompt_tokens: (existing.sum_prompt_tokens ?? 0) + (g.sum_prompt_tokens ?? 0),
        sum_completion_tokens:
          (existing.sum_completion_tokens ?? 0) + (g.sum_completion_tokens ?? 0),
      });
    }
  }

  return [...map.values()];
}

/**
 * Detect whether an aggregate groups array is missing known operations.
 * Returns the missing operation names.
 */
export function findMissingOperations(groups: AggregateGroup[]): string[] {
  const present = new Set(groups.map((g) => g.key.operation).filter(Boolean));
  return KNOWN_OPERATIONS.filter((op) => !present.has(op));
}

/**
 * Aggregate groups by a string key while dropping entries that do not have a
 * meaningful key value. Useful for risk/policy charts where older spans may
 * not contain newer fields (e.g. composite_risk_level, policy_decision).
 */
export function aggregateGroupsByStringKey(
  groups: AggregateGroup[],
  keyField: string,
): Array<{ key: string; count: number }> {
  const byKey = new Map<string, number>();

  for (const g of groups) {
    const raw = g.key[keyField];
    if (typeof raw !== 'string') continue;
    const normalized = raw.trim();
    if (!normalized) continue;
    byKey.set(normalized, (byKey.get(normalized) ?? 0) + (g.count ?? 0));
  }

  return [...byKey.entries()].map(([key, count]) => ({ key, count }));
}

// ─── Risk metrics helpers ─────────────────────────────────────────────────────

/**
 * Aggregated risk metrics computed from a list of SpanItems.
 * Fields are null when no item in the input had that field set (e.g. older
 * records that pre-date risk instrumentation).  Callers must not treat null
 * as 0 — it means "no data", not "zero risk".
 */
export interface RiskMetrics {
  /** Average composite risk score, or null if no items had the field. */
  avg_composite_risk_score: number | null;
  /** Average hallucination risk score, or null if no items had the field. */
  avg_hallucination_risk_score: number | null;
  /** Average shadow disagreement score, or null if no items had the field. */
  avg_shadow_disagreement_score: number | null;
  /** Average shadow numeric variance, or null if no items had the field. */
  avg_shadow_numeric_variance: number | null;
  /** Number of items where gate_blocked === true (only counts items that have the field). */
  gate_blocked_count: number;
  /**
   * Fraction of items-with-gate-field that were blocked, or null when no
   * item in the input had the gate_blocked field set at all.
   */
  gate_blocked_rate: number | null;
}

type NumericRiskField =
  | 'composite_risk_score'
  | 'hallucination_risk_score'
  | 'shadow_disagreement_score'
  | 'shadow_numeric_variance';

/**
 * Compute risk metric averages from a flat list of SpanItems.
 *
 * Items that do not have a given risk field (undefined / null) are excluded
 * from that field's average.  This prevents older records — which pre-date
 * the risk instrumentation layer — from diluting metrics with phantom zeros.
 */
export function computeRiskMetricsFromItems(items: SpanItem[]): RiskMetrics {
  function avgOf(field: NumericRiskField): number | null {
    const values = items
      .map((item) => item[field])
      .filter((v): v is number => v !== null && v !== undefined);
    if (!values.length) return null;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  const itemsWithGateField = items.filter(
    (i) => i.gate_blocked !== null && i.gate_blocked !== undefined,
  );
  const gateBlockedCount = itemsWithGateField.filter((i) => i.gate_blocked === true).length;
  const gateBlockedRate =
    itemsWithGateField.length > 0 ? gateBlockedCount / itemsWithGateField.length : null;

  return {
    avg_composite_risk_score: avgOf('composite_risk_score'),
    avg_hallucination_risk_score: avgOf('hallucination_risk_score'),
    avg_shadow_disagreement_score: avgOf('shadow_disagreement_score'),
    avg_shadow_numeric_variance: avgOf('shadow_numeric_variance'),
    gate_blocked_count: gateBlockedCount,
    gate_blocked_rate: gateBlockedRate,
  };
}

// ─── Total stats helpers ──────────────────────────────────────────────────────

export interface TotalStats {
  count: number;
  cost: number;
  promptTokens: number;
  completionTokens: number;
}

export function computeTotalsFromGroups(groups: AggregateGroup[]): TotalStats {
  return groups.reduce(
    (acc, g) => ({
      count: acc.count + (g.count ?? 0),
      cost: acc.cost + (g.sum_cost_usd ?? 0),
      promptTokens: acc.promptTokens + (g.sum_prompt_tokens ?? 0),
      completionTokens: acc.completionTokens + (g.sum_completion_tokens ?? 0),
    }),
    { count: 0, cost: 0, promptTokens: 0, completionTokens: 0 },
  );
}

export function computeTotalsFromItems(items: SpanItem[]): TotalStats {
  return items.reduce(
    (acc, item) => ({
      count: acc.count + 1,
      cost: acc.cost + (item.cost_usd ?? 0),
      promptTokens: acc.promptTokens + (item.prompt_tokens ?? 0),
      completionTokens: acc.completionTokens + (item.completion_tokens ?? 0),
    }),
    { count: 0, cost: 0, promptTokens: 0, completionTokens: 0 },
  );
}
