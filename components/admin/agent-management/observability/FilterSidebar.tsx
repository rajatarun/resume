'use client';

import { useState } from 'react';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { ListParams } from '../shared/observabilityFetch';

interface Props {
  filters: ListParams;
  onApply: (filters: ListParams) => void;
}

type ToggleChip = { key: 'is_shadow' | 'gate_blocked' | 'fallback_used'; label: string };
const TOGGLE_CHIPS: ToggleChip[] = [
  { key: 'is_shadow',    label: 'Shadow only' },
  { key: 'gate_blocked', label: 'Gate blocked' },
  { key: 'fallback_used', label: 'Fallback used' },
];

function LabelRow({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1"
    >
      {children}
    </label>
  );
}

export function FilterSidebar({ filters, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ListParams>(filters);

  const set = <K extends keyof ListParams>(k: K, v: ListParams[K]) =>
    setDraft((prev) => ({ ...prev, [k]: v }));

  const apply = () => {
    onApply(draft);
    setOpen(false);
  };

  const reset = () => {
    const blank: ListParams = {};
    setDraft(blank);
    onApply(blank);
    setOpen(false);
  };

  const toggleChip = (key: 'is_shadow' | 'gate_blocked' | 'fallback_used') => {
    const current = draft[key];
    setDraft((prev) => ({ ...prev, [key]: current === 'true' ? undefined : 'true' }));
  };

  const content = (
    <div className="space-y-4 text-sm">
      {/* ── Existing filters ──────────────────────────────── */}
      <div>
        <LabelRow htmlFor="filter-operation">Operation</LabelRow>
        <select
          id="filter-operation"
          value={draft.operation ?? ''}
          onChange={(e) => set('operation', e.target.value || undefined)}
          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <option value="">All</option>
          <option value="invoke_agent">invoke_agent</option>
          <option value="invoke_model">invoke_model</option>
          <option value="classify_question">classify_question</option>
          <option value="synthesize_answer">synthesize_answer</option>
        </select>
      </div>

      <div>
        <LabelRow htmlFor="filter-agent-id">Agent ID</LabelRow>
        <input
          id="filter-agent-id"
          type="text"
          value={draft.agent_id ?? ''}
          onChange={(e) => set('agent_id', e.target.value || undefined)}
          placeholder="e.g. AGENT123"
          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
        />
      </div>

      <div>
        <LabelRow htmlFor="filter-model-id">Model ID</LabelRow>
        <input
          id="filter-model-id"
          type="text"
          value={draft.model_id ?? ''}
          onChange={(e) => set('model_id', e.target.value || undefined)}
          placeholder="e.g. anthropic.claude-haiku-3"
          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
        />
      </div>

      <div>
        <LabelRow htmlFor="filter-decision">Decision</LabelRow>
        <select
          id="filter-decision"
          value={draft.decision ?? ''}
          onChange={(e) => set('decision', e.target.value || undefined)}
          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <option value="">All</option>
          <option value="allow">ALLOW</option>
          <option value="deny">DENY</option>
          <option value="shadow">SHADOW</option>
          <option value="review">REVIEW</option>
        </select>
      </div>

      {/* ── v0.2.1 filters ──────────────────────────────── */}
      <div>
        <LabelRow htmlFor="filter-risk-tier">Risk Tier</LabelRow>
        <select
          id="filter-risk-tier"
          value={draft.risk_tier ?? ''}
          onChange={(e) => set('risk_tier', e.target.value || undefined)}
          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <option value="">All</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div>
        <LabelRow htmlFor="filter-composite-risk">Composite Risk</LabelRow>
        <select
          id="filter-composite-risk"
          value={draft.composite_risk_level ?? ''}
          onChange={(e) => set('composite_risk_level', e.target.value || undefined)}
          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <option value="">All</option>
          <option value="low">Low</option>
          <option value="moderate">Moderate</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div>
        <LabelRow htmlFor="filter-policy-decision">Policy Decision</LabelRow>
        <select
          id="filter-policy-decision"
          value={draft.policy_decision ?? ''}
          onChange={(e) => set('policy_decision', e.target.value || undefined)}
          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <option value="">All</option>
          <option value="allow">Allow</option>
          <option value="block">Block</option>
        </select>
      </div>

      {/* ── Toggle chips ────────────────────────────────── */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Flags</p>
        <div className="flex flex-wrap gap-2">
          {TOGGLE_CHIPS.map(({ key, label }) => {
            const active = draft[key] === 'true';
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleChip(key)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-300 text-slate-600 hover:border-slate-500 dark:border-slate-600 dark:text-slate-400'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
          Date Range
        </p>
        <DateRangePicker
          value={{ start: draft.start ?? '', end: draft.end ?? '' }}
          onChange={(r: DateRange) => {
            set('start', r.start || undefined);
            set('end', r.end || undefined);
          }}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={apply}
          className="flex-1 rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Apply Filters
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
        >
          Reset
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="md:hidden mb-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600"
        >
          <span>☰</span>
          <span>Filters</span>
        </button>
        {open && (
          <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            {content}
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block w-56 shrink-0">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Filters</p>
          {content}
        </div>
      </div>
    </>
  );
}
