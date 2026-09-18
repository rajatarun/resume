'use client';

import { RISK_SIGNALS, Proposal, explain } from '@/lib/admin/gate';

/**
 * The gate, opened in place under the row it belongs to.
 *
 * This replaces the Control Room tab. That tab was a queue of blocked
 * articles, disabled routines and held policies — every row of which already
 * existed in Content, Tasks or Home — so it restated three screens and made an
 * operator leave the one they were on in order to act. The strip is the part
 * that was worth keeping, so it moved to where the thing is.
 *
 * Signals that could not be measured for this action are drawn slack and grey
 * rather than omitted. A missing measurement looks exactly like a clean one
 * once it is off the screen, and a zero-height bar would read as "measured,
 * and clean" — the most expensive available way to be wrong about risk.
 */

const DECISION_STYLES: Record<Proposal['risk']['decision'], string> = {
  ALLOW: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  REVIEW: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  BLOCK: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const SHORT_LABEL: Record<string, string> = {
  grounding_risk: 'grounding',
  self_consistency_risk: 'consistency',
  numeric_instability_risk: 'numeric',
  tool_mismatch_risk: 'tool match',
  drift_risk: 'drift',
  verifier_risk: 'verifier',
};

/** Scores run 0–0.6, so they are stretched to fill the strip before capping. */
function barHeight(value: number): number {
  return Math.max(8, Math.min(100, Math.round(value * 160)));
}

export function InlineGate({
  proposal,
  busy,
  onCommit,
  onDiscard,
}: {
  proposal: Proposal;
  busy: boolean;
  onCommit: () => void;
  onDiscard: () => void;
}) {
  const { risk } = proposal;
  const blocked = risk.decision === 'BLOCK';

  return (
    <div
      className="border-t border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40"
      role="region"
      aria-label={`Execution gate for ${proposal.title}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-wide text-slate-500">Risk vector</span>
        <span className="text-[11px] text-slate-500">{risk.signalsDefined} of 6 measured</span>
      </div>

      <ul className="mt-2 flex h-11 items-end gap-1.5" aria-hidden="true">
        {RISK_SIGNALS.map((signal) => {
          const value = risk.vector[signal];
          if (value === null) {
            return (
              <li
                key={signal}
                className="flex-1 rounded-sm bg-slate-300 dark:bg-slate-600"
                style={{ height: '12%' }}
              />
            );
          }
          return (
            <li
              key={signal}
              className={`flex-1 rounded-sm ${
                value >= 0.4 ? 'bg-amber-700 dark:bg-amber-500' : 'bg-slate-900 dark:bg-slate-200'
              }`}
              style={{ height: `${barHeight(value)}%` }}
            />
          );
        })}
      </ul>

      {/* The bars carry no meaning to a screen reader, so the same reading is
          given as text rather than as a label on a decorative list. */}
      <p className="sr-only">
        {RISK_SIGNALS.map((signal) => {
          const value = risk.vector[signal];
          return `${SHORT_LABEL[signal]}: ${value === null ? 'not measured' : value.toFixed(3)}`;
        }).join('. ')}
      </p>

      <p className="mt-2 text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-400">{explain(risk)}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${DECISION_STYLES[risk.decision]}`}
        >
          {risk.decision}
        </span>
        <span className="text-[11.5px] text-slate-600 dark:text-slate-400">composite {risk.composite.toFixed(2)}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {blocked ? (
          <button
            type="button"
            disabled
            className="min-h-[44px] flex-1 cursor-not-allowed rounded-lg bg-slate-200 px-4 text-sm font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400"
          >
            Blocked
          </button>
        ) : (
          <button
            type="button"
            onClick={onCommit}
            disabled={busy}
            className={`min-h-[44px] flex-1 rounded-lg px-4 text-sm font-medium disabled:opacity-60 ${
              risk.decision === 'ALLOW'
                ? 'bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900'
                : 'border border-amber-600 bg-white text-amber-800 hover:bg-amber-50 dark:bg-transparent dark:text-amber-300'
            }`}
          >
            {busy ? '…' : risk.decision === 'ALLOW' ? 'Commit' : 'Override & commit'}
          </button>
        )}
        <button
          type="button"
          onClick={onDiscard}
          disabled={busy}
          className="min-h-[44px] rounded-lg border border-slate-300 px-4 text-sm text-slate-900 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Discard
        </button>
      </div>
    </div>
  );
}
