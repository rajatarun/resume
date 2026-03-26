'use client';

import { Fragment, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { SpanItem, formatCost, formatTokens } from '../shared/observabilityFetch';
import { SkeletonRow } from './Skeleton';

interface Props {
  items: SpanItem[];
  isLoading: boolean;
  count: number;
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (col: string) => void;
}

function DecisionBadge({ decision }: { decision?: string }) {
  const cls =
    decision === 'ALLOW'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : decision === 'DENY'
        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        : decision === 'SHADOW'
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
      {decision ?? '—'}
    </span>
  );
}

function ShadowScoreBadge({ score }: { score?: number }) {
  if (score === null || score === undefined) return <span className="text-slate-400">—</span>;
  const cls =
    score < 0.1
      ? 'text-green-600 dark:text-green-400'
      : score < 0.3
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';
  return <span className={`font-mono text-xs ${cls}`}>{score.toFixed(3)}</span>;
}

type Col = { key: string; label: string; sortable?: boolean };
const COLS: Col[] = [
  { key: 'timestamp', label: 'Timestamp', sortable: true },
  { key: 'agent_id', label: 'Agent ID' },
  { key: 'model_id', label: 'Model ID' },
  { key: 'decision', label: 'Decision' },
  { key: 'prompt_tokens', label: 'Prompt', sortable: true },
  { key: 'completion_tokens', label: 'Completion', sortable: true },
  { key: 'cost_usd', label: 'Cost', sortable: true },
];

export function SpanTable({
  items,
  isLoading,
  count,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
  sortBy,
  sortOrder,
  onSort,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const SortIcon = ({ col }: { col: string }) =>
    sortBy === col ? (
      <span className="ml-1 text-slate-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
    ) : (
      <span className="ml-1 text-slate-200">↕</span>
    );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-xl border border-slate-200 py-16 text-center dark:border-slate-700">
        <p className="text-2xl">🔍</p>
        <p className="mt-2 text-sm text-slate-500">No spans match your filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="w-8 px-3 py-3" />
              {COLS.map((col) => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => onSort(col.key) : undefined}
                  className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ${col.sortable ? 'cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200' : ''}`}
                >
                  {col.label}
                  {col.sortable && <SortIcon col={col.key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
            {items.map((item) => {
              const isExp = expanded.has(item.trace_id);
              let ts = item.timestamp;
              try { ts = format(parseISO(item.timestamp), 'MMM d, HH:mm:ss'); } catch { /* keep raw */ }
              return (
                <Fragment key={item.trace_id}>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.trace_id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        aria-label={isExp ? 'Collapse' : 'Expand'}
                      >
                        {isExp ? '▼' : '▶'}
                      </button>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">{ts}</td>
                    <td className="px-3 py-2 font-mono text-xs">{item.agent_id ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">{item.model_id ?? '—'}</td>
                    <td className="px-3 py-2"><DecisionBadge decision={item.decision} /></td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{formatTokens(item.prompt_tokens)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{formatTokens(item.completion_tokens)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{formatCost(item.cost_usd)}</td>
                  </tr>
                  {isExp && (
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <td />
                      <td colSpan={7} className="px-3 py-3">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
                          <Detail label="Trace ID" value={item.trace_id} />
                          <Detail label="Operation" value={item.operation} />
                          <Detail label="Shadow Disagreement" value={<ShadowScoreBadge score={item.shadow_disagreement_score} />} />
                          <Detail label="Shadow Numeric Variance" value={<ShadowScoreBadge score={item.shadow_numeric_variance} />} />
                          <Detail label="Avg Prompt Tokens" value={formatTokens(item.prompt_tokens)} />
                          <Detail label="Avg Completion Tokens" value={formatTokens(item.completion_tokens)} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Showing {items.length} of {count} items</span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={onPrev}
            className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            ← Previous
          </button>
          <button
            type="button"
            disabled={!hasNext}
            onClick={onNext}
            className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="font-medium text-slate-500 dark:text-slate-400">{label}: </span>
      <span className="font-mono text-slate-700 dark:text-slate-300">{value}</span>
    </div>
  );
}
