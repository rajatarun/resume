'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminAccess } from '@/components/admin/AdminGate';
import { useToast } from '@/components/admin/ToastProvider';
import { fetchJson } from '@/lib/admin/api';
import { Article, normalizeArticleList } from '@/lib/admin/types';
import { listTasks, updateTask } from '@/lib/routineweave-api';
import { TaskDefinition } from '@/types/routineweave';
import { Proposal, propose } from '@/lib/admin/gate';
import { GateStrip } from './GateStrip';

/**
 * Control Room — one surface for everything waiting on a decision.
 *
 * Content and routines are already administrable here, in Content Manager and
 * in Tasks. What neither gives you is the answer to "what is waiting on me
 * right now", because that answer spans both: an article sitting in
 * AWAITING_APPROVAL and a disabled stock-research routine are the same class of
 * thing — work that has stopped and is waiting for a person — and today you
 * find them by remembering to look in two places.
 *
 * So this tab does not replace either. It reads both and sorts by what is
 * blocking, and every consequential action it offers goes through the gate
 * first. Neither existing tab is modified.
 */

type ArticleListResponse = { items: Article[] };

/** The statuses that mean "a person has to do something next". */
const BLOCKING_STATUSES = ['AWAITING_APPROVAL', 'REVISION_REQUESTED', 'FAILED'] as const;

const STATUS_COPY: Record<string, string> = {
  AWAITING_APPROVAL: 'waiting for your approval',
  REVISION_REQUESTED: 'you asked for edits — not yet resubmitted',
  FAILED: 'generation failed',
};

export default function ControlRoomClient() {
  const { isAllowed } = useAdminAccess();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [staged, setStaged] = useState<Proposal | null>(null);
  const [pending, setPending] = useState<(() => Promise<void>) | null>(null);
  const [busy, setBusy] = useState(false);

  const articleQueries = useQuery({
    queryKey: ['control-room', 'blocking-articles'],
    enabled: isAllowed,
    queryFn: async (): Promise<Article[]> => {
      const perStatus = await Promise.all(
        BLOCKING_STATUSES.map(async (status) => {
          const list = normalizeArticleList(
            await fetchJson<unknown>(`/admin/articles?status=${status}&limit=100`),
          ) as ArticleListResponse;
          return list.items;
        }),
      );
      return perStatus.flat();
    },
  });

  const tasksQuery = useQuery({
    queryKey: ['control-room', 'routines'],
    enabled: isAllowed,
    queryFn: listTasks,
  });

  // `?? []` would mint a new array every render, so the memo below would never
  // actually memoize and the list would re-filter on each keystroke elsewhere.
  const routines = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const stalled = useMemo(() => routines.filter((t) => !t.enabled), [routines]);
  const activeCount = useMemo(() => routines.filter((t) => t.enabled).length, [routines]);

  /** Stage a proposal. Nothing runs until the gate is committed. */
  function stage(proposal: Proposal, commit: () => Promise<void>) {
    setStaged(proposal);
    setPending(() => commit);
  }

  function discard() {
    setStaged(null);
    setPending(null);
    toast.success('Discarded — nothing ran.');
  }

  async function commit() {
    if (!pending) return;
    setBusy(true);
    try {
      await pending();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Commit failed.');
    } finally {
      setBusy(false);
      setStaged(null);
      setPending(null);
    }
  }

  function proposeApprove(article: Article) {
    stage(
      propose('publish', `Approve and publish “${article.title}”`, article.id),
      async () => {
        await fetchJson(`/admin/articles/${article.id}/actions/approve`, { method: 'POST' });
        toast.success('Approved and written to S3.');
        await queryClient.invalidateQueries({ queryKey: ['control-room'] });
        await queryClient.invalidateQueries({ queryKey: ['articles'] });
      },
    );
  }

  function proposeRegenerate(article: Article) {
    stage(
      propose('generate', `Regenerate the draft for “${article.title}”`, article.id),
      async () => {
        await fetchJson(`/admin/articles/${article.id}/actions/generate`, { method: 'POST' });
        toast.success('Generation queued — the article is unchanged until it returns.');
        await queryClient.invalidateQueries({ queryKey: ['control-room'] });
      },
    );
  }

  function proposeEnable(task: TaskDefinition) {
    stage(
      propose('routine-toggle', `Re-enable the routine “${task.task_name}”`, task.task_name),
      async () => {
        await updateTask(task.task_name, { enabled: true });
        toast.success(`Routine enabled — next run follows ${task.schedule}.`);
        await queryClient.invalidateQueries({ queryKey: ['control-room'] });
        await queryClient.invalidateQueries({ queryKey: ['routineweave'] });
      },
    );
  }

  if (!isAllowed) return null;

  const blocking = articleQueries.data ?? [];
  const queueSize = blocking.length + stalled.length;

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Control Room</h2>
        <p className="max-w-prose text-sm text-slate-600 dark:text-slate-400">
          Everything waiting on a decision, from the content pipeline and from your
          routines, in one queue. Content Manager and Tasks still own the full
          detail — this answers the narrower question of what has stopped.
        </p>
      </header>

      <GateStrip proposal={staged} busy={busy} onCommit={commit} onDiscard={discard} />

      <section aria-labelledby="queue-heading" className="space-y-3">
        <h3 id="queue-heading" className="text-sm font-semibold">
          Waiting on you{' '}
          <span className="font-mono text-xs tabular-nums text-slate-500">({queueSize})</span>
        </h3>

        {(articleQueries.isLoading || tasksQuery.isLoading) && (
          <p className="text-sm text-slate-500">Loading…</p>
        )}

        {articleQueries.isError && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            Could not read the content pipeline:{' '}
            {articleQueries.error instanceof Error ? articleQueries.error.message : 'unknown error'}
          </p>
        )}
        {tasksQuery.isError && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            Could not read your routines:{' '}
            {tasksQuery.error instanceof Error ? tasksQuery.error.message : 'unknown error'}
          </p>
        )}

        {!articleQueries.isLoading && !tasksQuery.isLoading && queueSize === 0 && (
          <p className="rounded-xl border border-dashed p-6 text-sm text-slate-500">
            Nothing is blocked. Every article has moved on and every routine is enabled.
          </p>
        )}

        <ul className="space-y-3">
          {blocking.map((article) => (
            <li key={article.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{article.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {STATUS_COPY[article.status] ?? article.status}
                    {article.updatedAt ? ` · last touched ${article.updatedAt}` : ''}
                  </p>
                  {article.generated?.weekly_hook?.angle && (
                    <p className="mt-2 max-w-prose text-sm italic text-slate-600 dark:text-slate-400">
                      {article.generated.weekly_hook.angle}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  {article.status === 'AWAITING_APPROVAL' && (
                    <button
                      type="button"
                      onClick={() => proposeApprove(article)}
                      className="rounded border px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Approve…
                    </button>
                  )}
                  {(article.status === 'FAILED' || article.status === 'REVISION_REQUESTED') && (
                    <button
                      type="button"
                      onClick={() => proposeRegenerate(article)}
                      className="rounded border px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Regenerate…
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}

          {stalled.map((task) => (
            <li key={task.task_name} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{task.task_name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    routine is disabled — it will not fire on{' '}
                    <span className="font-mono text-xs">{task.schedule}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => proposeEnable(task)}
                  className="shrink-0 rounded border px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Re-enable…
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="routines-heading" className="space-y-3">
        <h3 id="routines-heading" className="text-sm font-semibold">
          Routines{' '}
          <span className="font-mono text-xs tabular-nums text-slate-500">
            ({activeCount} active of {routines.length})
          </span>
        </h3>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">Routine</th>
                <th scope="col" className="px-3 py-2 font-semibold">Schedule</th>
                <th scope="col" className="px-3 py-2 font-semibold">Delivers to</th>
                <th scope="col" className="px-3 py-2 font-semibold">Keeps results</th>
                <th scope="col" className="px-3 py-2 font-semibold">State</th>
              </tr>
            </thead>
            <tbody>
              {routines.length === 0 && !tasksQuery.isLoading && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-slate-500">
                    No routines defined yet. Tasks is where you create one.
                  </td>
                </tr>
              )}
              {routines.map((task) => (
                <tr key={task.task_name} className="border-t">
                  <td className="px-3 py-2 font-medium">{task.task_name}</td>
                  <td className="px-3 py-2 font-mono text-xs tabular-nums">{task.schedule}</td>
                  <td className="px-3 py-2">{task.output?.type ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                    {task.save_result ? 'yes' : 'no — output is delivered and dropped'}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        task.enabled
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {task.enabled ? 'active' : 'disabled'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-500">
          A routine with <span className="font-medium">keeps results: no</span> delivers its
          output and keeps nothing, so there is no history to read afterwards — worth knowing
          before you go looking for one.
        </p>
      </section>
    </div>
  );
}
