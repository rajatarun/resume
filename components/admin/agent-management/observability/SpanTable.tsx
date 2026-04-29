'use client';

import { Fragment, useState } from 'react';
import { format, parseISO, differenceInMilliseconds } from 'date-fns';
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
  const upper = decision?.toUpperCase();
  const cls =
    upper === 'ALLOW'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : upper === 'DENY'
        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        : upper === 'SHADOW'
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          : upper === 'REVIEW'
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
      {decision ? decision.toUpperCase() : '—'}
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

// Progress bar that goes red when high, green when low
function RiskBar({ value, inverted = false }: { value?: number | null; inverted?: boolean }) {
  if (value === null || value === undefined) return <span className="text-slate-400 text-xs">—</span>;
  const pct = Math.min(Math.max(value, 0), 1) * 100;
  const isHigh = inverted ? value < 0.5 : value >= 0.8;
  const isMid  = inverted ? value < 0.7 : value >= 0.5;
  const color  = isHigh ? 'bg-red-500' : isMid ? 'bg-amber-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-slate-200 dark:bg-slate-700">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{value.toFixed(3)}</span>
    </div>
  );
}

function Badge({ label, variant }: { label: string; variant: 'red' | 'green' | 'slate' | 'blue' }) {
  const cls = {
    red:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    blue:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  }[variant];
  return <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="ml-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
      title="Copy"
    >
      {copied ? '✓' : '⎘'}
    </button>
  );
}

function TruncatedHash({ value }: { value?: string | null }) {
  if (!value) return <span className="text-slate-400">—</span>;
  const short = value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-8)}` : value;
  return (
    <span className="font-mono text-xs">
      {short}
      <CopyButton text={value} />
    </span>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{title}</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-3">{children}</div>
    </div>
  );
}

function SpanDrawer({ item }: { item: SpanItem }) {
  const hasTimings = item.start_time !== null && item.start_time !== undefined && item.end_time !== null && item.end_time !== undefined;
  let latencyMs: number | null = null;
  if (hasTimings) {
    try {
      latencyMs = differenceInMilliseconds(parseISO(item.end_time!), parseISO(item.start_time!));
    } catch { /* leave null */ }
  }

  const fmtBool = (v?: boolean | null) => {
    if (v === null || v === undefined) return '—';
    return v ? 'Yes' : 'No';
  };

  return (
    <div className="space-y-1 py-2">
      {/* ── Existing fields ─────────────────────────────── */}
      <DrawerSection title="Trace">
        <Detail label="Trace ID" value={item.trace_id} />
        <Detail label="Operation" value={item.operation} />
        {item.service && <Detail label="Service" value={item.service} />}
        {item.decision_reason && <Detail label="Decision Reason" value={item.decision_reason} />}
        <Detail label="Shadow Disagreement" value={<ShadowScoreBadge score={item.shadow_disagreement_score} />} />
        <Detail label="Shadow Numeric Variance" value={<ShadowScoreBadge score={item.shadow_numeric_variance} />} />
        <Detail label="Prompt Tokens" value={formatTokens(item.prompt_tokens)} />
        <Detail label="Completion Tokens" value={formatTokens(item.completion_tokens)} />
      </DrawerSection>

      {/* ── Risk Scores ──────────────────────────────────── */}
      <DrawerSection title="Risk Scores">
        <Detail label="Composite Risk" value={<RiskBar value={item.composite_risk_score} />} />
        <Detail label="Hallucination Risk" value={<RiskBar value={item.hallucination_risk_score} />} />
        <Detail label="Grounding Score" value={<RiskBar value={item.grounding_score} inverted />} />
        <Detail label="Verifier Score" value={<RiskBar value={item.verifier_score} inverted />} />
        <Detail label="Self Consistency" value={<RiskBar value={item.self_consistency_score} inverted />} />
        <Detail label="Drift Risk" value={<RiskBar value={item.drift_risk} />} />
      </DrawerSection>

      {/* ── Policy & Gate ───────────────────────────────── */}
      <DrawerSection title="Policy & Gate">
        <Detail
          label="Policy Decision"
          value={
            item.policy_decision
              ? <Badge label={item.policy_decision} variant={item.policy_decision === 'allow' ? 'green' : item.policy_decision === 'block' ? 'red' : 'slate'} />
              : '—'
          }
        />
        <Detail label="Policy ID" value={item.policy_id ?? '—'} />
        <Detail label="Policy Version" value={item.policy_version ?? '—'} />
        <Detail
          label="Gate Blocked"
          value={
            item.gate_blocked === true ? <Badge label="Blocked" variant="red" />
            : item.gate_blocked === false ? <Badge label="Passed" variant="green" />
            : '—'
          }
        />
        <Detail
          label="Risk Tier"
          value={
            item.risk_tier
              ? <Badge label={item.risk_tier} variant={item.risk_tier === 'high' ? 'red' : item.risk_tier === 'medium' ? 'slate' : 'green'} />
              : '—'
          }
        />
      </DrawerSection>

      {/* ── Execution ───────────────────────────────────── */}
      <DrawerSection title="Execution">
        <Detail label="Retries" value={item.retries !== null && item.retries !== undefined ? String(item.retries) : '—'} />
        <Detail label="Fallback Used" value={fmtBool(item.fallback_used)} />
        <Detail label="Fallback Type" value={item.fallback_type ?? '—'} />
        <Detail label="Fallback Reason" value={item.fallback_reason ?? '—'} />
        <Detail label="Shadow Invocation" value={fmtBool(item.is_shadow)} />
        <Detail label="Exec Token ID" value={item.exec_token_id ?? '—'} />
        <Detail label="Exec Token TTL" value={item.exec_token_ttl_ms !== null && item.exec_token_ttl_ms !== undefined ? `${item.exec_token_ttl_ms.toLocaleString()} ms` : '—'} />
        <Detail label="Token Verified" value={fmtBool(item.exec_token_verified)} />
      </DrawerSection>

      {/* ── Prompt Fingerprints ─────────────────────────── */}
      <DrawerSection title="Prompt Fingerprints">
        <Detail label="Prompt Hash" value={<TruncatedHash value={item.prompt_hash} />} />
        <Detail label="Normalised Hash" value={<TruncatedHash value={item.normalized_prompt_hash} />} />
        <Detail label="Answer Hash" value={<TruncatedHash value={item.answer_hash} />} />
        <Detail label="Prompt Size" value={item.prompt_size_chars !== null && item.prompt_size_chars !== undefined ? `${item.prompt_size_chars.toLocaleString()} chars` : '—'} />
      </DrawerSection>

      {/* ── Timing ──────────────────────────────────────── */}
      {hasTimings && (
        <DrawerSection title="Timing">
          <Detail label="Start Time" value={item.start_time!} />
          <Detail label="End Time" value={item.end_time!} />
          <Detail label="Latency" value={latencyMs !== null ? `${latencyMs.toLocaleString()} ms` : '—'} />
        </DrawerSection>
      )}
    </div>
  );
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
                    <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">{item.model ?? item.model_id ?? '—'}</td>
                    <td className="px-3 py-2"><DecisionBadge decision={item.decision} /></td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{formatTokens(item.prompt_tokens)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{formatTokens(item.completion_tokens)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{formatCost(item.cost_usd)}</td>
                  </tr>
                  {isExp && (
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <td />
                      <td colSpan={7} className="px-4 py-3">
                        <SpanDrawer item={item} />
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
