'use client';

import { useState, useCallback } from 'react';
import { subHours, formatISO } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import {
  fetchMetricsAggregate,
  hasObsToken,
  AggregateGroup,
  MetricsAggregateResponse,
} from '../shared/observabilityFetch';
import { ErrorBanner } from '../shared/ErrorBanner';
import { StatsBar } from './StatsBar';
import { TimeSeriesChart } from './TimeSeriesChart';
import { CostByAgentChart } from './CostByAgentChart';
import { OperationPieChart } from './OperationPieChart';
import { DecisionPieChart } from './DecisionPieChart';
import { DateRangePicker, DateRange } from './DateRangePicker';

function defaultRange(): DateRange {
  const now = new Date();
  return { start: formatISO(subHours(now, 24)), end: formatISO(now) };
}

interface QueryState {
  groups: AggregateGroup[];
  isLoading: boolean;
  error: string;
}

function useAggregateQuery(
  aggregate: string,
  range: DateRange,
  refetchInterval: number | undefined,
): QueryState {
  const params = {
    aggregate: aggregate as Parameters<typeof fetchMetricsAggregate>[0]['aggregate'],
    start: range.start,
    end: range.end,
  };

  const queryFn = useCallback(
    () => fetchMetricsAggregate(params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [aggregate, range.start, range.end],
  );

  const { data, isLoading, isError, error } = useQuery<MetricsAggregateResponse>({
    queryKey: ['obs', aggregate, range.start, range.end],
    queryFn,
    enabled: hasObsToken(),
    refetchInterval,
  });

  return {
    groups: data?.groups ?? [],
    isLoading,
    error: isError ? (error instanceof Error ? error.message : 'Failed to load') : '',
  };
}

export function ObservabilityDashboard() {
  const [range, setRange] = useState<DateRange>(defaultRange);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [granularity, setGranularity] = useState<'by_hour' | 'by_day'>('by_hour');
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set());
  const [tokenInput, setTokenInput] = useState('');
  const [showTokenPrompt, setShowTokenPrompt] = useState(!hasObsToken());

  const interval = autoRefresh ? 60_000 : undefined;

  const opQuery = useAggregateQuery('by_operation', range, interval);
  const tsQuery = useAggregateQuery(granularity, range, interval);
  const agentQuery = useAggregateQuery('by_agent', range, interval);
  const decisionQuery = useAggregateQuery('by_decision', range, interval);

  const errors = [opQuery, tsQuery, agentQuery, decisionQuery]
    .map((q) => q.error)
    .filter((e): e is string => Boolean(e) && !dismissedErrors.has(e));

  if (showTokenPrompt) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
        <p className="mb-3 font-medium text-amber-800 dark:text-amber-300">
          Authentication required
        </p>
        <p className="mb-4 text-sm text-amber-700 dark:text-amber-400">
          Enter your Bedrock Observability token to view metrics.
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Paste bearer token…"
            className="flex-1 rounded border border-amber-300 bg-white px-3 py-1.5 text-sm dark:border-amber-700 dark:bg-slate-800"
          />
          <button
            type="button"
            onClick={() => {
              if (tokenInput.trim()) {
                localStorage.setItem('tw_auth_token', tokenInput.trim());
                setShowTokenPrompt(false);
              }
            }}
            className="rounded bg-amber-600 px-4 py-1.5 text-sm text-white hover:bg-amber-700"
          >
            Save
          </button>
        </div>
        {process.env.NEXT_PUBLIC_DEV_AUTH_TOKEN && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            Dev token found in env — click Save with empty input or set NEXT_PUBLIC_DEV_AUTH_TOKEN.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <DateRangePicker value={range} onChange={setRange} />
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {(['by_hour', 'by_day'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGranularity(g)}
                className={`rounded px-2 py-1 text-xs ${granularity === g ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'border border-slate-300 dark:border-slate-600'}`}
              >
                {g === 'by_hour' ? 'Hourly' : 'Daily'}
              </button>
            ))}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <span className="text-slate-600 dark:text-slate-400">Auto-refresh</span>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            {autoRefresh && <span className="text-green-600 text-xs">● 60s</span>}
          </label>
          <button
            type="button"
            onClick={() => { localStorage.removeItem('tw_auth_token'); setShowTokenPrompt(true); }}
            className="text-xs text-slate-400 hover:text-slate-600 underline"
          >
            Change token
          </button>
        </div>
      </div>

      {/* Errors */}
      {errors.map((e) => (
        <ErrorBanner key={e} message={e} onDismiss={() => setDismissedErrors((s) => new Set([...s, e]))} />
      ))}

      {/* KPI cards */}
      <StatsBar groups={opQuery.groups} isLoading={opQuery.isLoading} />

      {/* Time series */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Invocations &amp; Cost Over Time
        </h3>
        <TimeSeriesChart groups={tsQuery.groups} granularity={granularity} isLoading={tsQuery.isLoading} />
      </div>

      {/* Cost by agent */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Top 10 Agents by Cost
        </h3>
        <CostByAgentChart groups={agentQuery.groups} isLoading={agentQuery.isLoading} />
      </div>

      {/* Pie charts */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Operation Breakdown</h3>
          <OperationPieChart groups={opQuery.groups} isLoading={opQuery.isLoading} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Decision Distribution</h3>
          <DecisionPieChart groups={decisionQuery.groups} isLoading={decisionQuery.isLoading} />
        </div>
      </div>
    </div>
  );
}
