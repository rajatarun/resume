/**
 * The control styles the agent-management forms share.
 *
 * Every modal had spelled its own out — `rounded border px-3 py-2` on fields
 * and cancel buttons, `rounded bg-slate-900 px-3 py-2 text-white` on submits.
 * That was 28 copies with no dark-mode variants (in an admin that has dark mode
 * everywhere else) and a touch target around 36px, under the 44px the rest of
 * the redesign uses. Named here so a change lands once.
 */
export const FIELD =
  'min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 ' +
  'placeholder:text-slate-400 focus-ring dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';

export const TEXTAREA = `${FIELD} py-2.5 leading-relaxed`;

export const BTN_PRIMARY =
  'focus-ring min-h-[44px] rounded-lg bg-slate-900 px-4 text-sm font-medium text-white ' +
  'transition hover:bg-slate-700 disabled:opacity-60';

export const BTN_SECONDARY =
  'focus-ring min-h-[44px] rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 ' +
  'transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800';
