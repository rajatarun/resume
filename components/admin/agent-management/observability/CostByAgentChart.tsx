'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AggregateGroup, formatCost } from '../shared/observabilityFetch';
import { SkeletonChart } from './Skeleton';

interface Props {
  groups: AggregateGroup[];
  isLoading: boolean;
  onAgentClick?: (agentId: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs shadow dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-1 font-medium">{label}</p>
      <p className="text-emerald-600">Cost: {formatCost(payload[0]?.value)}</p>
    </div>
  );
}

export function CostByAgentChart({ groups, isLoading, onAgentClick }: Props) {
  if (isLoading) return <SkeletonChart height={256} />;

  const data = [...groups]
    .sort((a, b) => (b.sum_cost_usd ?? 0) - (a.sum_cost_usd ?? 0))
    .slice(0, 10)
    .map((g) => ({
      agent: g.key.agent_id ?? 'unknown',
      cost: g.sum_cost_usd ?? 0,
    }));

  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        No agent data available
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
            tickFormatter={(v) => `$${Number(v).toFixed(4)}`}
          />
          <YAxis
            type="category"
            dataKey="agent"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={90}
            tickFormatter={(v: string) => (v.length > 12 ? v.slice(0, 12) + '…' : v)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="cost"
            fill="#315cf0"
            radius={[0, 4, 4, 0]}
            onClick={onAgentClick ? (d) => onAgentClick((d as unknown as { agent?: string }).agent ?? '') : undefined}
            style={onAgentClick ? { cursor: 'pointer' } : undefined}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
