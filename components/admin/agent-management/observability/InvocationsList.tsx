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
  const [sortBy, setSortBy] = useState<ListParams['sort_by']>('timestamp');
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
    const validCols = ['timestamp', 'cost_usd', 'prompt_tokens', 'completion_tokens'] as const;
    type ValidCol = (typeof validCols)[number];
    if (validCols.includes(col as ValidCol)) {
      if (sortBy === col) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
      else { setSortBy(col as ValidCol); setSortOrder('desc'); }
    }
  };

  return (
    <div className="flex gap-4">
      <FilterSidebar filters={filters} onApply={setFilters} />

      <div className="min-w-0 flex-1 space-y-4">
        {errorMsg && (
          <ErrorBanner message={errorMsg} onDismiss={() => setErrorMsg('')} />
        )}

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
