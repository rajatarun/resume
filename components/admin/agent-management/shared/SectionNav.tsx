'use client';

/**
 * The sub-navigation inside the Agents tab.
 *
 * It used to be a second underlined tab strip directly under the first, at the
 * same weight — two rows of tabs, five each, with nothing saying which one
 * governed the other. Pills read as subordinate to the underlined strip above,
 * which is the actual relationship. It scrolls rather than wrapping, so the row
 * stays one line on a phone instead of reflowing and shifting the content down.
 */
export function SectionNav<T extends string>({
  sections,
  current,
  onSelect,
}: {
  sections: readonly T[];
  current: T;
  onSelect: (section: T) => void;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <div
        role="tablist"
        aria-label="Agent management sections"
        className="flex w-max gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800"
      >
        {sections.map((section) => {
          const active = section === current;
          return (
            <button
              key={section}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(section)}
              className={`focus-ring min-h-[40px] whitespace-nowrap rounded-lg px-3.5 text-sm transition ${
                active
                  ? 'bg-white font-semibold text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {section}
            </button>
          );
        })}
      </div>
    </div>
  );
}
