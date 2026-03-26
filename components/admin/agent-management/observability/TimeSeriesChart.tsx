'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { AggregateGroup, formatCost } from '../shared/observabilityFetch';
import { SkeletonChart } from './Skeleton';

interface Props {
  groups: AggregateGroup[];
  granularity: 'by_hour' | 'by_day';
  isLoading: boolean;
}

interface ChartPoint {
  label: string;
  count: number;
  cost: number;
}

function toPoints(groups: AggregateGroup[], granularity: 'by_hour' | 'by_day'): ChartPoint[] {
  return groups.map((g) => {
    const raw = g.key.hour ?? g.key.day ?? '';
    let label = raw;
    try {
      label =
        granularity === 'by_hour'
          ? format(parseISO(raw), 'MMM d HH:mm')
          : format(parseISO(raw), 'MMM d');
    } catch {
      label = raw;
    }
    return { label, count: g.count ?? 0, cost: g.sum_cost_usd ?? 0 };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs shadow dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-1 font-medium text-slate-700 dark:text-slate-300">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}:{' '}
          {entry.name === 'cost' ? formatCost(entry.value) : entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export function TimeSeriesChart({ groups, granularity, isLoading }: Props) {
  if (isLoading) return <SkeletonChart height={256} />;

  const data = toPoints(groups, granularity);

  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        No data for this time range
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#315cf0" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#315cf0" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.toLocaleString()}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${Number(v).toFixed(4)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="count"
            name="invocations"
            stroke="#315cf0"
            fill="url(#colorCount)"
            strokeWidth={2}
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="cost"
            name="cost"
            stroke="#10b981"
            fill="url(#colorCost)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
