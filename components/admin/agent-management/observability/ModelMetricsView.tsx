'use client';

import { useState, useCallback } from 'react';
import { subHours, formatISO } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
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
import { DateRangePicker, DateRange } from './DateRangePicker';
import { SkeletonChart } from './Skeleton';

interface Props {
  onModelClick?: (modelId: string) => void;
}

function defaultRange(): DateRange {
  const now = new Date();
  return { start: formatISO(subHours(now, 24)), end: formatISO(now) };
}

const COLS: AggregateColumn[] = [
  {
    key: 'model_id',
    label: 'Model ID',
    getValue: (g) => g.key.model_id ?? '—',
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
    key: 'sum_completion_tokens',
    label: 'Total Completion',
    getValue: (g) => g.sum_completion_tokens,
    format: (v) => formatTokens(v as number),
    numeric: true,
  },
];

interface ChartPoint {
  model: string;
  prompt: number;
  completion: number;
}

function TokenStackedChart({ groups, isLoading }: { groups: AggregateGroup[]; isLoading: boolean }) {
  if (isLoading) return <SkeletonChart height={256} />;

  const data: ChartPoint[] = [...groups]
    .sort((a, b) => ((b.sum_prompt_tokens ?? 0) + (b.sum_completion_tokens ?? 0)) - ((a.sum_prompt_tokens ?? 0) + (a.sum_completion_tokens ?? 0)))
    .slice(0, 10)
    .map((g) => ({
      model: g.key.model_id ?? 'unknown',
      prompt: g.sum_prompt_tokens ?? 0,
      completion: g.sum_completion_tokens ?? 0,
    }));

  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        No model data available
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (v as number).toLocaleString()}
          />
          <YAxis
            type="category"
            dataKey="model"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={120}
            tickFormatter={(v: string) => (v.length > 16 ? v.slice(0, 16) + '…' : v)}
          />
          <Tooltip
            formatter={(value, name) => [(value as number).toLocaleString(), name as string]}
          />
          <Legend />
          <Bar dataKey="prompt" name="Prompt Tokens" stackId="tokens" fill="#315cf0" />
          <Bar dataKey="completion" name="Completion Tokens" stackId="tokens" fill="#10b981" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ModelMetricsView({ onModelClick }: Props) {
  const [range, setRange] = useState<DateRange>(defaultRange);
  const [errorMsg, setErrorMsg] = useState('');

  const queryFn = useCallback(
    () => fetchMetricsAggregate({ aggregate: 'by_model', start: range.start, end: range.end }),
    [range.start, range.end],
  );

  const { data, isLoading, isError, error } = useQuery<MetricsAggregateResponse>({
    queryKey: ['obs', 'by_model', range.start, range.end],
    queryFn,
    enabled: hasObsToken(),
  });

  const groups: AggregateGroup[] = data?.groups ?? [];

  if (isError && !errorMsg) {
    setErrorMsg(error instanceof Error ? error.message : 'Failed to load model metrics');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {errorMsg && <ErrorBanner message={errorMsg} onDismiss={() => setErrorMsg('')} />}

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Token Usage by Model (Top 10)
        </h3>
        <TokenStackedChart groups={groups} isLoading={isLoading} />
      </div>

      <AggregateTable
        groups={groups}
        columns={COLS}
        isLoading={isLoading}
        onRowClick={onModelClick ? (g) => onModelClick(g.key.model_id ?? '') : undefined}
        rowClickLabel="View invocations →"
      />
    </div>
  );
}
