'use client';

import { useState, useCallback } from 'react';
import { subHours, subDays, differenceInDays, formatISO } from 'date-fns';
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
import { RiskKpiRow } from './RiskKpiRow';
import { RiskTimeSeriesChart } from './RiskTimeSeriesChart';
import { RiskDonutCharts } from './RiskDonutCharts';
import { ReliabilityStatsPanel } from './ReliabilityStatsPanel';

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
  extraParams?: Record<string, string | undefined>,
): QueryState {
  const params = {
    aggregate: aggregate as Parameters<typeof fetchMetricsAggregate>[0]['aggregate'],
    start: range.start,
    end: range.end,
    ...extraParams,
  };

  const queryFn = useCallback(
    () => fetchMetricsAggregate(params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [aggregate, range.start, range.end, JSON.stringify(extraParams)],
  );

  const { data, isLoading, isError, error } = useQuery<MetricsAggregateResponse>({
    queryKey: ['obs', aggregate, range.start, range.end, extraParams],
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
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set());
  const [tokenInput, setTokenInput] = useState('');
  const [showTokenPrompt, setShowTokenPrompt] = useState(!hasObsToken());
  // Active composite risk level filter (set by clicking KPI cards)
  const [activeRiskLevel, setActiveRiskLevel] = useState<string | undefined>();

  // Derive granularity from range width
  const rangedays = differenceInDays(
    range.end ? new Date(range.end) : new Date(),
    range.start ? new Date(range.start) : subHours(new Date(), 24),
  );
  const granularity: 'by_hour' | 'by_day' = rangedays > 3 ? 'by_day' : 'by_hour';

  const interval = autoRefresh ? 60_000 : undefined;

  // Core aggregate queries
  const opQuery      = useAggregateQuery('by_operation', range, interval);
  const tsQuery      = useAggregateQuery(granularity,    range, interval);
  const agentQuery   = useAggregateQuery('by_agent',     range, interval);
  const decisionQuery = useAggregateQuery('by_decision', range, interval);

  // v0.2.1 risk queries
  const riskKpiQuery      = useAggregateQuery('by_composite_risk_level',    range, interval);
  const halluciKpiQuery   = useAggregateQuery('by_hallucination_risk_level', range, interval);
  const policyKpiQuery    = useAggregateQuery('by_policy_decision',          range, interval);

  // Reliability queries (base + filtered for rate computation)
  const reliabilityBase    = useAggregateQuery('by_operation', range, interval);
  const fallbackQuery      = useAggregateQuery('by_operation', range, interval, { fallback_used: 'true' });
  const gateBlockedQuery   = useAggregateQuery('by_operation', range, interval, { gate_blocked: 'true' });

  // Risk time series uses the same granularity as the main time series
  const riskTsQuery = useAggregateQuery(granularity, range, interval);

  const allQueries = [
    opQuery, tsQuery, agentQuery, decisionQuery,
    riskKpiQuery, halluciKpiQuery, policyKpiQuery,
    reliabilityBase, fallbackQuery, gateBlockedQuery,
    riskTsQuery,
  ];

  const errors = allQueries
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

      {/* ── Risk Overview KPI Row ─────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Risk Overview
          {activeRiskLevel && (
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500 dark:bg-slate-800">
              filtered: {activeRiskLevel}
              <button
                type="button"
                onClick={() => setActiveRiskLevel(undefined)}
                className="ml-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </span>
          )}
        </h3>
        <RiskKpiRow
          groups={riskKpiQuery.groups}
          isLoading={riskKpiQuery.isLoading}
          activeLevel={activeRiskLevel}
          onLevelClick={setActiveRiskLevel}
        />
      </div>

      {/* ── KPI stats bar ──────────────────────────────────── */}
      <StatsBar groups={opQuery.groups} isLoading={opQuery.isLoading} />

      {/* ── Risk score time series ─────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Risk Scores Over Time
        </h3>
        <RiskTimeSeriesChart groups={riskTsQuery.groups} granularity={granularity} isLoading={riskTsQuery.isLoading} />
      </div>

      {/* ── Invocations & cost time series ────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Invocations &amp; Cost Over Time
        </h3>
        <TimeSeriesChart groups={tsQuery.groups} granularity={granularity} isLoading={tsQuery.isLoading} />
      </div>

      {/* ── Risk breakdown donuts ──────────────────────────── */}
      <RiskDonutCharts
        compositeGroups={riskKpiQuery.groups}
        hallucinationGroups={halluciKpiQuery.groups}
        policyGroups={policyKpiQuery.groups}
        isLoading={riskKpiQuery.isLoading || halluciKpiQuery.isLoading || policyKpiQuery.isLoading}
      />

      {/* ── Reliability stats ──────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Reliability</h3>
        <ReliabilityStatsPanel
          baseGroups={reliabilityBase.groups}
          fallbackGroups={fallbackQuery.groups}
          gateBlockedGroups={gateBlockedQuery.groups}
          isLoading={reliabilityBase.isLoading || fallbackQuery.isLoading || gateBlockedQuery.isLoading}
        />
      </div>

      {/* ── Cost by agent ──────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Top 10 Agents by Cost
        </h3>
        <CostByAgentChart groups={agentQuery.groups} isLoading={agentQuery.isLoading} />
      </div>

      {/* ── Pie charts ─────────────────────────────────────── */}
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
