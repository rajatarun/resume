'use client';

const BASE = 'https://sr6lu63px1.execute-api.us-east-1.amazonaws.com/prod';

// ─── Auth ────────────────────────────────────────────────────────────────────

export function getObsToken(): string {
  return '123';
}

export function hasObsToken(): boolean {
  return true;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type AggregateType =
  | 'none'
  | 'by_agent'
  | 'by_model'
  | 'by_operation'
  | 'by_decision'
  | 'by_hour'
  | 'by_day'
  | 'by_risk_tier'
  | 'by_composite_risk_level'
  | 'by_hallucination_risk_level'
  | 'by_policy_decision';

export interface SpanItem {
  trace_id: string;
  operation: string;
  timestamp: string;
  agent_id?: string;
  model_id?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  cost_usd?: number;
  decision?: string;
  shadow_disagreement_score?: number;
  shadow_numeric_variance?: number;

  // v0.2.1 numeric risk fields
  composite_risk_score?: number;
  composite_risk_level?: string;
  hallucination_risk_score?: number;
  hallucination_risk_level?: string;
  grounding_score?: number;
  verifier_score?: number;
  self_consistency_score?: number;
  numeric_variance_score?: number;
  grounding_risk?: number;
  self_consistency_risk?: number;
  numeric_instability_risk?: number;
  tool_mismatch_risk?: number;
  drift_risk?: number;
  confidence?: number;
  retries?: number;
  prompt_size_chars?: number;
  exec_token_ttl_ms?: number;

  // v0.2.1 boolean fields
  fallback_used?: boolean;
  is_shadow?: boolean;
  gate_blocked?: boolean;
  tool_claim_mismatch?: boolean;
  exec_token_verified?: boolean;

  // v0.2.1 string fields
  risk_tier?: string;
  policy_decision?: string;
  policy_id?: string;
  policy_version?: string;
  span_id?: string;
  parent_span_id?: string;
  prompt_hash?: string;
  normalized_prompt_hash?: string;
  answer_hash?: string;
  fallback_type?: string;
  fallback_reason?: string;
  request_id?: string;
  method?: string;
  tool_name?: string;
  tool_args_hash?: string;
  tool_criticality?: string;
  exec_token_id?: string;
  exec_token_hash?: string;

  // v0.2.1 datetime fields
  start_time?: string;
  end_time?: string;
}

export interface AggregateGroup {
  key: Record<string, string>;
  count: number;
  sum_cost_usd?: number;
  avg_cost_usd?: number;
  min_cost_usd?: number;
  max_cost_usd?: number;
  sum_prompt_tokens?: number;
  avg_prompt_tokens?: number;
  min_prompt_tokens?: number;
  max_prompt_tokens?: number;
  sum_completion_tokens?: number;
  avg_completion_tokens?: number;
  min_completion_tokens?: number;
  max_completion_tokens?: number;
  sum_shadow_disagreement_score?: number;
  avg_shadow_disagreement_score?: number;

  // v0.2.1 aggregate fields
  sum_composite_risk_score?: number;
  avg_composite_risk_score?: number;
  min_composite_risk_score?: number;
  max_composite_risk_score?: number;
  sum_hallucination_risk_score?: number;
  avg_hallucination_risk_score?: number;
  min_hallucination_risk_score?: number;
  max_hallucination_risk_score?: number;
  sum_grounding_score?: number;
  avg_grounding_score?: number;
  min_grounding_score?: number;
  max_grounding_score?: number;
  sum_verifier_score?: number;
  avg_verifier_score?: number;
  sum_self_consistency_score?: number;
  avg_self_consistency_score?: number;
  sum_drift_risk?: number;
  avg_drift_risk?: number;
  sum_retries?: number;
  avg_retries?: number;
  sum_confidence?: number;
  avg_confidence?: number;
}

export interface MetricsListResponse {
  items: SpanItem[];
  count: number;
  scanned_count: number;
  next_token?: string;
}

export interface MetricsAggregateResponse {
  aggregate: string;
  groups: AggregateGroup[];
  total_count: number;
  scanned_count: number;
}

export interface ListParams {
  start?: string;
  end?: string;
  operation?: string;
  agent_id?: string;
  model_id?: string;
  decision?: string;
  sort_by?:
    | 'timestamp'
    | 'cost_usd'
    | 'prompt_tokens'
    | 'completion_tokens'
    | 'composite_risk_score'
    | 'hallucination_risk_score'
    | 'retries'
    | 'grounding_score';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  next_token?: string;

  // v0.2.1 filter params
  risk_tier?: string;
  policy_decision?: string;
  composite_risk_level?: string;
  hallucination_risk_level?: string;
  is_shadow?: 'true' | 'false';
  gate_blocked?: 'true' | 'false';
  fallback_used?: 'true' | 'false';
}

export interface AggregateParams {
  aggregate: Exclude<AggregateType, 'none'>;
  start?: string;
  end?: string;
  agent_id?: string;
  model_id?: string;
  limit?: number;

  // v0.2.1 filter params
  risk_tier?: string;
  policy_decision?: string;
  composite_risk_level?: string;
  hallucination_risk_level?: string;
  is_shadow?: 'true' | 'false';
  gate_blocked?: 'true' | 'false';
  fallback_used?: 'true' | 'false';
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function formatCost(v?: number): string {
  if (v === null || v === undefined) return '—';
  return `$${v.toFixed(6)}`;
}

export function formatTokens(v?: number): string {
  if (v === null || v === undefined) return '—';
  return v.toLocaleString();
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

type QueryParams = Record<string, string | number | boolean | null | undefined>;

function buildUrl(path: string, params: QueryParams): string {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function observabilityFetch<T>(
  path: string,
  params: QueryParams = {},
): Promise<T> {
  const token = getObsToken();
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(buildUrl(path, params), { headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      typeof data === 'object' && data && 'error' in data
        ? String((data as { error?: unknown }).error)
        : `Request failed with status ${res.status}`;
    const error = new Error(message) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  return data as T;
}

export function fetchMetricsList(params: ListParams): Promise<MetricsListResponse> {
  return observabilityFetch<MetricsListResponse>('/observability/agent-metrics', {
    ...(params as QueryParams),
    aggregate: 'none',
  });
}

export function fetchMetricsAggregate(params: AggregateParams): Promise<MetricsAggregateResponse> {
  return observabilityFetch<MetricsAggregateResponse>('/observability/agent-metrics', {
    ...(params as unknown as QueryParams),
  });
}
