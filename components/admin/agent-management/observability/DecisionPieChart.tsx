'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AggregateGroup } from '../shared/observabilityFetch';
import { SkeletonChart } from './Skeleton';

const DECISION_COLORS: Record<string, string> = {
  ALLOW: '#16a34a',
  DENY: '#dc2626',
  SHADOW: '#2563eb',
};
const FALLBACK_COLORS = ['#8b5cf6', '#f59e0b', '#06b6d4'];

interface Props {
  groups: AggregateGroup[];
  isLoading: boolean;
}

export function DecisionPieChart({ groups, isLoading }: Props) {
  if (isLoading) return <SkeletonChart height={220} />;

  const data = groups.map((g) => ({
    name: g.key.decision ?? 'unknown',
    value: g.count ?? 0,
  }));

  if (!data.length) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        No decision data
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
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={DECISION_COLORS[entry.name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
              />
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
