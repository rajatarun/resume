'use client';

import { subHours, subDays, formatISO } from 'date-fns';

export interface DateRange {
  start: string;
  end: string;
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS = [
  { label: '1h',  hours: 1 },
  { label: '6h',  hours: 6 },
  { label: '24h', hours: 24 },
  { label: '7d',  hours: 24 * 7 },
  { label: '30d', hours: 24 * 30 },
];

function toLocalInput(iso: string): string {
  if (!iso) return '';
  // datetime-local wants "YYYY-MM-DDTHH:MM"
  return iso.slice(0, 16);
}

function fromLocalInput(local: string): string {
  if (!local) return '';
  return new Date(local).toISOString();
}

export function DateRangePicker({ value, onChange }: Props) {
  const applyPreset = (hours: number) => {
    const now = new Date();
    onChange({
      start: formatISO(hours >= 24 * 7 ? subDays(now, hours / 24) : subHours(now, hours)),
      end: formatISO(now),
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p.hours)}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <input
          type="datetime-local"
          value={toLocalInput(value.start)}
          onChange={(e) => onChange({ ...value, start: fromLocalInput(e.target.value) })}
          className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800"
        />
        <span className="text-xs text-slate-500">to</span>
        <input
          type="datetime-local"
          value={toLocalInput(value.end)}
          onChange={(e) => onChange({ ...value, end: fromLocalInput(e.target.value) })}
          className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800"
        />
      </div>
    </div>
  );
}
