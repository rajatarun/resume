'use client';

const BASE = 'https://sr6lu63px1.execute-api.us-east-1.amazonaws.com/prod';

// ─── Auth ────────────────────────────────────────────────────────────────────

export function getObsToken(): string {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_DEV_AUTH_TOKEN ?? '';
  return (
    localStorage.getItem('tw_auth_token') ??
    process.env.NEXT_PUBLIC_DEV_AUTH_TOKEN ??
    ''
  );
}

export function hasObsToken(): boolean {
  if (typeof window === 'undefined') return Boolean(process.env.NEXT_PUBLIC_DEV_AUTH_TOKEN);
  return Boolean(localStorage.getItem('tw_auth_token') ?? process.env.NEXT_PUBLIC_DEV_AUTH_TOKEN);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type AggregateType =
  | 'none'
  | 'by_agent'
  | 'by_model'
  | 'by_operation'
  | 'by_decision'
  | 'by_hour'
  | 'by_day';

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
  sort_by?: 'timestamp' | 'cost_usd' | 'prompt_tokens' | 'completion_tokens';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  next_token?: string;
}

export interface AggregateParams {
  aggregate: Exclude<AggregateType, 'none'>;
  start?: string;
  end?: string;
  agent_id?: string;
  model_id?: string;
  limit?: number;
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
