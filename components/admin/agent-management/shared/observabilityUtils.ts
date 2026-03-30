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
