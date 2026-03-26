'use client';

import { useState } from 'react';
import { AggregateGroup, formatCost, formatTokens } from '../shared/observabilityFetch';
import { SkeletonRow } from './Skeleton';

export interface AggregateColumn {
  key: string;
  label: string;
  getValue: (g: AggregateGroup) => string | number | undefined;
  format?: (v: string | number | undefined) => string;
  numeric?: boolean;
}

interface Props {
  groups: AggregateGroup[];
  columns: AggregateColumn[];
  isLoading: boolean;
  onRowClick?: (group: AggregateGroup) => void;
  rowClickLabel?: string;
}

type SortDir = 'asc' | 'desc';

const DEFAULT_COLS: AggregateColumn[] = [
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
    label: 'Prompt Tokens',
    getValue: (g) => g.sum_prompt_tokens,
    format: (v) => formatTokens(v as number),
    numeric: true,
  },
  {
    key: 'sum_completion_tokens',
    label: 'Completion Tokens',
    getValue: (g) => g.sum_completion_tokens,
    format: (v) => formatTokens(v as number),
    numeric: true,
  },
];

export { DEFAULT_COLS };

export function AggregateTable({ groups, columns, isLoading, onRowClick, rowClickLabel }: Props) {
  const [sort, setSort] = useState<{ col: string; dir: SortDir }>({ col: 'sum_cost_usd', dir: 'desc' });

  const toggleSort = (col: string) => {
    setSort((prev) =>
      prev.col === col ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'desc' },
    );
  };

  const sorted = [...groups].sort((a, b) => {
    const col = columns.find((c) => c.key === sort.col);
    if (!col) return 0;
    const av = col.getValue(a) ?? 0;
    const bv = col.getValue(b) ?? 0;
    const n = typeof av === 'number' ? (av as number) - (bv as number) : String(av).localeCompare(String(bv));
    return sort.dir === 'asc' ? n : -n;
  });

  const SortIcon = ({ col }: { col: string }) =>
    sort.col === col ? (
      <span className="ml-1 text-slate-400">{sort.dir === 'asc' ? '↑' : '↓'}</span>
    ) : (
      <span className="ml-1 text-slate-200">↕</span>
    );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (!sorted.length) {
    return (
      <div className="rounded-xl border border-slate-200 py-12 text-center text-sm text-slate-400 dark:border-slate-700">
        No data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                className={`cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ${col.numeric ? 'text-right' : ''}`}
              >
                {col.label}
                <SortIcon col={col.key} />
              </th>
            ))}
            {onRowClick && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
          {sorted.map((group, i) => (
            <tr
              key={i}
              className={onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800' : ''}
              onClick={onRowClick ? () => onRowClick(group) : undefined}
            >
              {columns.map((col) => {
                const raw = col.getValue(group);
                const display = col.format ? col.format(raw) : (raw ?? '—');
                return (
                  <td
                    key={col.key}
                    className={`px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300 ${col.numeric ? 'text-right' : ''}`}
                  >
                    {display}
                  </td>
                );
              })}
              {onRowClick && (
                <td className="px-4 py-3 text-right">
                  <span className="text-xs text-brand-500 hover:underline">{rowClickLabel ?? 'View →'}</span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
