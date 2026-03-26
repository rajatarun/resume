'use client';

import { useState } from 'react';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { ListParams } from '../shared/observabilityFetch';

interface Props {
  filters: ListParams;
  onApply: (filters: ListParams) => void;
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

  const content = (
    <div className="space-y-4 text-sm">
      <div>
        <label htmlFor="filter-operation" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
          Operation
        </label>
        <select
          id="filter-operation"
          value={draft.operation ?? ''}
          onChange={(e) => set('operation', e.target.value || undefined)}
          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <option value="">All</option>
          <option value="invoke_agent">invoke_agent</option>
          <option value="invoke_model">invoke_model</option>
        </select>
      </div>

      <div>
        <label htmlFor="filter-agent-id" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
          Agent ID
        </label>
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
        <label htmlFor="filter-model-id" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
          Model ID
        </label>
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
        <label htmlFor="filter-decision" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
          Decision
        </label>
        <select
          id="filter-decision"
          value={draft.decision ?? ''}
          onChange={(e) => set('decision', e.target.value || undefined)}
          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <option value="">All</option>
          <option value="ALLOW">ALLOW</option>
          <option value="DENY">DENY</option>
          <option value="SHADOW">SHADOW</option>
        </select>
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
