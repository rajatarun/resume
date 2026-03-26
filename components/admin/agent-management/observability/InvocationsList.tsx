'use client';

import { useState, useCallback, useEffect } from 'react';
import { subHours, formatISO } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import {
  fetchMetricsList,
  hasObsToken,
  ListParams,
  MetricsListResponse,
} from '../shared/observabilityFetch';
import { ErrorBanner } from '../shared/ErrorBanner';
import { FilterSidebar } from './FilterSidebar';
import { SpanTable } from './SpanTable';

interface Props {
  initialAgentId?: string;
}

type SortBy = NonNullable<ListParams['sort_by']>;

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'timestamp',              label: 'Timestamp' },
  { value: 'cost_usd',               label: 'Cost' },
  { value: 'prompt_tokens',          label: 'Prompt tokens' },
  { value: 'completion_tokens',      label: 'Completion tokens' },
  { value: 'composite_risk_score',   label: 'Composite risk score' },
  { value: 'hallucination_risk_score', label: 'Hallucination risk' },
  { value: 'retries',                label: 'Retries' },
  { value: 'grounding_score',        label: 'Grounding score' },
];

function defaultFilters(): ListParams {
  const now = new Date();
  return {
    start: formatISO(subHours(now, 24)),
    end: formatISO(now),
    limit: 50,
  };
}

export function InvocationsList({ initialAgentId }: Props) {
  const [filters, setFilters] = useState<ListParams>(() => ({
    ...defaultFilters(),
    ...(initialAgentId ? { agent_id: initialAgentId } : {}),
  }));
  const [sortBy, setSortBy] = useState<SortBy>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [tokenStack, setTokenStack] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset pagination when filters or sort change
  useEffect(() => {
    setTokenStack([]);
  }, [filters, sortBy, sortOrder]);

  const currentToken = tokenStack[tokenStack.length - 1];

  const queryParams: ListParams = {
    ...filters,
    sort_by: sortBy,
    sort_order: sortOrder,
    next_token: currentToken,
  };

  const queryFn = useCallback(
    () => fetchMetricsList(queryParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(queryParams)],
  );

  const { data, isLoading, isError, error } = useQuery<MetricsListResponse>({
    queryKey: ['obs', 'list', queryParams],
    queryFn,
    enabled: hasObsToken(),
  });

  useEffect(() => {
    if (isError) setErrorMsg(error instanceof Error ? error.message : 'Failed to load spans');
  }, [isError, error]);

  const handleSort = (col: string) => {
    const validCols = SORT_OPTIONS.map((o) => o.value);
    if (validCols.includes(col as SortBy)) {
      if (sortBy === col) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
      else { setSortBy(col as SortBy); setSortOrder('desc'); }
    }
  };

  return (
    <div className="flex gap-4">
      <FilterSidebar filters={filters} onApply={setFilters} />

      <div className="min-w-0 flex-1 space-y-4">
        {errorMsg && (
          <ErrorBanner message={errorMsg} onDismiss={() => setErrorMsg('')} />
        )}

        {/* Sort toolbar */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as SortBy); setSortOrder('desc'); }}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
        </div>

        <SpanTable
          items={data?.items ?? []}
          isLoading={isLoading}
          count={data?.count ?? 0}
          hasNext={Boolean(data?.next_token)}
          hasPrev={tokenStack.length > 0}
          onNext={() => {
            if (data?.next_token) setTokenStack((s) => [...s, data.next_token!]);
          }}
          onPrev={() => setTokenStack((s) => s.slice(0, -1))}
          sortBy={sortBy ?? 'timestamp'}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      </div>
    </div>
  );
}
