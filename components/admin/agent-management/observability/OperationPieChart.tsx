'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AggregateGroup } from '../shared/observabilityFetch';
import { SkeletonChart } from './Skeleton';

const COLORS = ['#315cf0', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface Props {
  groups: AggregateGroup[];
  isLoading: boolean;
}

export function OperationPieChart({ groups, isLoading }: Props) {
  if (isLoading) return <SkeletonChart height={220} />;

  const data = groups.map((g) => ({
    name: g.key.operation ?? 'unknown',
    value: g.count ?? 0,
  }));

  if (!data.length) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        No operation data
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [(value as number).toLocaleString(), 'invocations']}
          />
          <Legend iconSize={10} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
