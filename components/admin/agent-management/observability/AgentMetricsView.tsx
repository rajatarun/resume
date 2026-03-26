'use client';

import { useState, useCallback } from 'react';
import { subHours, formatISO } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import {
  fetchMetricsAggregate,
  hasObsToken,
  AggregateGroup,
  MetricsAggregateResponse,
  formatCost,
  formatTokens,
} from '../shared/observabilityFetch';
import { ErrorBanner } from '../shared/ErrorBanner';
import { AggregateTable, AggregateColumn } from './AggregateTable';
import { CostByAgentChart } from './CostByAgentChart';
import { DateRangePicker, DateRange } from './DateRangePicker';

interface Props {
  onAgentClick?: (agentId: string) => void;
}

function defaultRange(): DateRange {
  const now = new Date();
  return { start: formatISO(subHours(now, 24)), end: formatISO(now) };
}

const COLS: AggregateColumn[] = [
  {
    key: 'agent_id',
    label: 'Agent ID',
    getValue: (g) => g.key.agent_id ?? '—',
  },
  {
    key: 'count',
    label: 'Count',
    getValue: (g) => g.count,
    format: (v) => formatTokens(v as number),
    numeric: true,
  },
  {
    key: 'sum_cost_usd',
    label: 'Total Cost',
    getValue: (g) => g.sum_cost_usd,
    format: (v) => formatCost(v as number),
    numeric: true,
  },
  {
    key: 'avg_cost_usd',
    label: 'Avg Cost',
    getValue: (g) => g.avg_cost_usd,
    format: (v) => formatCost(v as number),
    numeric: true,
  },
  {
    key: 'sum_prompt_tokens',
    label: 'Total Prompt',
    getValue: (g) => g.sum_prompt_tokens,
    format: (v) => formatTokens(v as number),
    numeric: true,
  },
  {
    key: 'avg_prompt_tokens',
    label: 'Avg Prompt',
    getValue: (g) => g.avg_prompt_tokens,
    format: (v) => formatTokens(v as number),
    numeric: true,
  },
  {
    key: 'sum_completion_tokens',
    label: 'Total Completion',
    getValue: (g) => g.sum_completion_tokens,
    format: (v) => formatTokens(v as number),
    numeric: true,
  },
];

export function AgentMetricsView({ onAgentClick }: Props) {
  const [range, setRange] = useState<DateRange>(defaultRange);
  const [errorMsg, setErrorMsg] = useState('');

  const queryFn = useCallback(
    () => fetchMetricsAggregate({ aggregate: 'by_agent', start: range.start, end: range.end }),
    [range.start, range.end],
  );

  const { data, isLoading, isError, error } = useQuery<MetricsAggregateResponse>({
    queryKey: ['obs', 'by_agent', range.start, range.end],
    queryFn,
    enabled: hasObsToken(),
  });

  const groups: AggregateGroup[] = data?.groups ?? [];

  if (isError && !errorMsg) {
    setErrorMsg(error instanceof Error ? error.message : 'Failed to load agent metrics');
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {errorMsg && <ErrorBanner message={errorMsg} onDismiss={() => setErrorMsg('')} />}

      {/* Bar chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Top 10 Agents by Cost
        </h3>
        <CostByAgentChart
          groups={groups}
          isLoading={isLoading}
          onAgentClick={onAgentClick}
        />
      </div>

      {/* Table */}
      <AggregateTable
        groups={groups}
        columns={COLS}
        isLoading={isLoading}
        onRowClick={onAgentClick ? (g) => onAgentClick(g.key.agent_id ?? '') : undefined}
        rowClickLabel="View invocations →"
      />
    </div>
  );
}
