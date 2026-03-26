'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { AggregateGroup } from '../shared/observabilityFetch';
import { SkeletonChart } from './Skeleton';

interface Props {
  groups: AggregateGroup[];
  granularity: 'by_hour' | 'by_day';
  isLoading: boolean;
}

interface ChartPoint {
  label: string;
  count: number;
  composite: number | null;
  hallucination: number | null;
  grounding: number | null;
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
    return {
      label,
      count: g.count ?? 0,
      composite: g.avg_composite_risk_score ?? null,
      hallucination: g.avg_hallucination_risk_score ?? null,
      grounding: g.avg_grounding_score ?? null,
    };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs shadow dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-1 font-medium text-slate-700 dark:text-slate-300">{label}</p>
      {payload.map((entry: { name: string; value: number | null; color: string }) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {entry.value !== null ? entry.value.toFixed(3) : '—'}
        </p>
      ))}
    </div>
  );
}

export function RiskTimeSeriesChart({ groups, granularity, isLoading }: Props) {
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
        <LineChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 1]}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.toFixed(1)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="composite"
            name="composite risk"
            stroke="#ef4444"
            strokeWidth={2.5}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="hallucination"
            name="hallucination risk"
            stroke="#f97316"
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="grounding"
            name="grounding quality"
            stroke="#10b981"
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
