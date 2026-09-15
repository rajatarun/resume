'use client';

import { RISK_SIGNALS, Proposal, explain } from '@/lib/admin/gate';

const DECISION_STYLES = {
  ALLOW: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  REVIEW: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  BLOCK: 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300',
} as const;

/**
 * The staged proposal, and the six threads it was scored on.
 *
 * Signals that could not be measured for this action are drawn slack rather
 * than omitted: an operator has to be able to see how much of the vector
 * actually informed the verdict, because a missing measurement looks exactly
 * like a good one once it is off the screen.
 */
export function GateStrip({
  proposal,
  busy,
  onCommit,
  onDiscard,
}: {
  proposal: Proposal | null;
  busy: boolean;
  onCommit: () => void;
  onDiscard: () => void;
}) {
  if (!proposal) {
    return (
      <div
        className="rounded-xl border border-dashed p-4 text-sm text-slate-500"
        role="status"
      >
        Gate idle — nothing staged. Publishing, drafting and firing a routine are
        proposed here first, then committed separately.
      </div>
    );
  }

  const { risk } = proposal;
  const blocked = risk.decision === 'BLOCK';

  return (
    <div className="rounded-xl border p-4" role="region" aria-label="Execution gate">
      <div className="flex flex-wrap items-start gap-4">
        <ul
          className="flex h-11 items-end gap-1.5"
          aria-label={`${risk.signalsDefined} of 6 risk signals measured`}
        >
          {RISK_SIGNALS.map((signal) => {
            const value = risk.vector[signal];
            if (value === null) {
              return (
                <li
                  key={signal}
                  className="h-11 w-2 rounded-sm bg-slate-200 opacity-60 dark:bg-slate-700"
                  title={`${signal}: not measurable for this action`}
                />
              );
            }
            return (
              <li
                key={signal}
                className="w-2 rounded-sm bg-slate-900 dark:bg-slate-200"
                style={{ height: `${Math.max(6, Math.round((value / 0.6) * 44))}px` }}
                title={`${signal}: ${value.toFixed(3)}`}
              />
            );
          })}
        </ul>

        <div className="min-w-0 flex-1">
          <p className="font-medium">{proposal.title}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{explain(risk)}</p>
          <p className="mt-1 font-mono text-[11px] tabular-nums text-slate-500">
            {RISK_SIGNALS.map((s) => {
              const v = risk.vector[s];
              return `${s.replace(/_risk$/, '')} ${v === null ? '—' : v.toFixed(2)}`;
            }).join('  ·  ')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${DECISION_STYLES[risk.decision]}`}
          >
            {risk.decision}
          </span>
          <button
            type="button"
            onClick={onDiscard}
            disabled={busy}
            className="rounded border px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onCommit}
            disabled={blocked || busy}
            className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
          >
            {busy ? 'Committing…' : risk.decision === 'REVIEW' ? 'Override & commit' : 'Commit'}
          </button>
        </div>
      </div>

      {blocked && (
        <p className="mt-3 text-sm text-red-700 dark:text-red-400" role="alert">
          Blocked. Nothing will run. Change the action or the input rather than retrying it.
        </p>
      )}
    </div>
  );
}
