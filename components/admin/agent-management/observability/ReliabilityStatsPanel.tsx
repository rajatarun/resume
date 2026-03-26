'use client';

import { AggregateGroup } from '../shared/observabilityFetch';
import { SkeletonCard } from './Skeleton';

interface Props {
  baseGroups: AggregateGroup[];
  fallbackGroups: AggregateGroup[];
  gateBlockedGroups: AggregateGroup[];
  isLoading: boolean;
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}

function StatCard({ label, value, sub, highlight }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-5 ${highlight ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold ${highlight ? 'text-amber-700 dark:text-amber-300' : 'text-slate-900 dark:text-slate-100'}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function sumRetries(groups: AggregateGroup[]): number {
  return groups.reduce((acc, g) => acc + (g.sum_retries ?? 0), 0);
}

function totalCount(groups: AggregateGroup[]): number {
  return groups.reduce((acc, g) => acc + g.count, 0);
}

function avgShadowDisagreement(groups: AggregateGroup[]): number | null {
  const withData = groups.filter((g) => g.avg_shadow_disagreement_score != null);
  if (!withData.length) return null;
  const sum = withData.reduce((acc, g) => acc + (g.avg_shadow_disagreement_score ?? 0), 0);
  return sum / withData.length;
}

function formatRate(num: number, denom: number): string {
  if (!denom) return '—';
  return `${((num / denom) * 100).toFixed(1)}%`;
}

export function ReliabilityStatsPanel({ baseGroups, fallbackGroups, gateBlockedGroups, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const total = totalCount(baseGroups);
  const fallbackCount = totalCount(fallbackGroups);
  const gateBlockedCount = totalCount(gateBlockedGroups);
  const retries = sumRetries(baseGroups);
  const shadowAvg = avgShadowDisagreement(baseGroups);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        label="Total Retries"
        value={retries.toLocaleString()}
        sub="across all spans"
      />
      <StatCard
        label="Fallback Rate"
        value={formatRate(fallbackCount, total)}
        sub={`${fallbackCount.toLocaleString()} fallback spans`}
        highlight={fallbackCount > 0 && total > 0 && fallbackCount / total > 0.05}
      />
      <StatCard
        label="Gate-Blocked Rate"
        value={formatRate(gateBlockedCount, total)}
        sub={`${gateBlockedCount.toLocaleString()} blocked spans`}
        highlight={gateBlockedCount > 0 && total > 0 && gateBlockedCount / total > 0.02}
      />
      <StatCard
        label="Avg Shadow Disagreement"
        value={shadowAvg !== null ? shadowAvg.toFixed(3) : '—'}
        sub="lower is better"
      />
    </div>
  );
}
