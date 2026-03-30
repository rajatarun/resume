'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AggregateGroup } from '../shared/observabilityFetch';
import { aggregateGroupsByStringKey } from '../shared/observabilityUtils';
import { SkeletonChart } from './Skeleton';

interface DonutChartProps {
  groups: AggregateGroup[];
  keyField: string;
  isLoading: boolean;
  colors: Record<string, string>;
  fallbackColor: string;
}

function DonutChart({ groups, keyField, isLoading, colors, fallbackColor }: DonutChartProps) {
  if (isLoading) return <SkeletonChart height={200} />;

  const data = aggregateGroupsByStringKey(groups, keyField)
    .map((g) => ({ name: g.key, value: g.count }))
    .filter((d) => d.value > 0);

  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        No data
      </div>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="75%"
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={colors[entry.name.toLowerCase()] ?? fallbackColor}
              />
            ))}
          </Pie>
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [typeof value === 'number' ? value.toLocaleString() : String(value ?? ''), 'spans']}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-slate-600 dark:text-slate-400">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

const COMPOSITE_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  moderate: '#eab308',
  low:      '#22c55e',
};

const HALLUCINATION_COLORS: Record<string, string> = {
  high:   '#ef4444',
  medium: '#f97316',
  low:    '#22c55e',
};

const POLICY_COLORS: Record<string, string> = {
  allow: '#22c55e',
  block: '#ef4444',
};

interface Props {
  compositeGroups: AggregateGroup[];
  hallucinationGroups: AggregateGroup[];
  policyGroups: AggregateGroup[];
  isLoading: boolean;
}

export function RiskDonutCharts({ compositeGroups, hallucinationGroups, policyGroups, isLoading }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Composite Risk</h3>
        <DonutChart
          groups={compositeGroups}
          keyField="composite_risk_level"
          isLoading={isLoading}
          colors={COMPOSITE_COLORS}
          fallbackColor="#94a3b8"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Hallucination Risk</h3>
        <DonutChart
          groups={hallucinationGroups}
          keyField="hallucination_risk_level"
          isLoading={isLoading}
          colors={HALLUCINATION_COLORS}
          fallbackColor="#94a3b8"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Policy Gate</h3>
        <DonutChart
          groups={policyGroups}
          keyField="policy_decision"
          isLoading={isLoading}
          colors={POLICY_COLORS}
          fallbackColor="#94a3b8"
        />
      </div>
    </div>
  );
}
