'use client';

import { AggregateGroup, formatCost, formatTokens } from '../shared/observabilityFetch';
import { SkeletonCard } from './Skeleton';

interface Props {
  groups: AggregateGroup[];
  totalCount?: number;
  isLoading: boolean;
}

interface Stat {
  label: string;
  value: string;
  sub?: string;
}

function StatCard({ label, value, sub }: Stat) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export function StatsBar({ groups, totalCount, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const totals = groups.reduce(
    (acc, g) => ({
      count: acc.count + (g.count ?? 0),
      cost: acc.cost + (g.sum_cost_usd ?? 0),
      prompt: acc.prompt + (g.sum_prompt_tokens ?? 0),
      completion: acc.completion + (g.sum_completion_tokens ?? 0),
    }),
    { count: 0, cost: 0, prompt: 0, completion: 0 },
  );

  const stats: Stat[] = [
    {
      label: 'Total Invocations',
      value: (totalCount ?? totals.count).toLocaleString(),
      sub: 'Selected range',
    },
    { label: 'Total Cost', value: formatCost(totals.cost), sub: 'USD' },
    { label: 'Prompt Tokens', value: formatTokens(totals.prompt) },
    { label: 'Completion Tokens', value: formatTokens(totals.completion) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}
