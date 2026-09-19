/**
 * The state that was missing. Every list here mapped straight over its array,
 * so an empty one drew a table header with nothing beneath it — and "no agents
 * exist", "the request is still in flight" and "the API returned nothing"
 * all looked identical: a heading and blank space.
 */
export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
