'use client';

import { AggregateGroup } from '../shared/observabilityFetch';
import { aggregateGroupsByStringKey } from '../shared/observabilityUtils';
import { SkeletonCard } from './Skeleton';

interface Props {
  groups: AggregateGroup[];
  isLoading: boolean;
  activeLevel: string | undefined;
  onLevelClick: (level: string | undefined) => void;
}

const LEVELS = [
  { key: 'critical', label: 'Critical', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', activeBorder: 'border-red-500 dark:border-red-500', dot: 'bg-red-500' },
  { key: 'high',     label: 'High',     color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', activeBorder: 'border-orange-500 dark:border-orange-500', dot: 'bg-orange-500' },
  { key: 'moderate', label: 'Moderate', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', activeBorder: 'border-yellow-500 dark:border-yellow-500', dot: 'bg-yellow-500' },
  { key: 'low',      label: 'Low',      color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', activeBorder: 'border-green-500 dark:border-green-500', dot: 'bg-green-500' },
] as const;

export function RiskKpiRow({ groups, isLoading, activeLevel, onLevelClick }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const countByLevel = aggregateGroupsByStringKey(groups, 'composite_risk_level').reduce<Record<string, number>>(
    (acc, item) => {
      acc[item.key] = item.count;
      return acc;
    },
    {},
  );

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {LEVELS.map(({ key, label, color, bg, border, activeBorder, dot }) => {
        const isActive = activeLevel === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onLevelClick(isActive ? undefined : key)}
            className={`rounded-xl border p-5 text-left transition-all hover:shadow-md ${bg} ${isActive ? activeBorder : border}`}
          >
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${dot}`} />
              <p className={`text-xs font-semibold uppercase tracking-wide ${color}`}>{label}</p>
            </div>
            <p className={`mt-2 text-2xl font-semibold ${color}`}>
              {(countByLevel[key] ?? 0).toLocaleString()}
            </p>
            <p className={`mt-0.5 text-xs ${color} opacity-70`}>spans</p>
          </button>
        );
      })}
    </div>
  );
}
