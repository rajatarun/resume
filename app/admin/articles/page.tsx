"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useToast } from "@/components/admin/ToastProvider";
import { fetchJson } from "@/lib/admin/api";
import { ARTICLE_STATUSES, Article, ArticleStatus, normalizeArticle, normalizeArticleList } from "@/lib/admin/types";
import { useAdminAccess } from "@/components/admin/AdminGate";

type ArticleAction = {
  label: string;
  onClick?: () => void;
  href?: ComponentProps<typeof Link>["href"];
};

function renderAction(action: ArticleAction, key: string) {
  if (action.href) {
    return <Link className="underline" href={action.href} key={key}>{action.label}</Link>;
  }
  return <button type="button" className="underline disabled:opacity-50" onClick={action.onClick} disabled={!action.onClick} key={key}>{action.label}</button>;
}

export default function ArticlesPage() {
  type ActionMutationVariables = { id: string; action: string; body?: unknown };
  const [status, setStatus] = useState<ArticleStatus>("DRAFT");
  const [search, setSearch] = useState("");
  const [pollingId, setPollingId] = useState<string | null>(null);
  const [pollStartedAt, setPollStartedAt] = useState<number>(0);
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isAllowed } = useAdminAccess();

  const query = useQuery({
    queryKey: ["articles", status],
    queryFn: async () => normalizeArticleList(await fetchJson<unknown>(`/admin/articles?status=${status}&limit=100`)),
    enabled: isAllowed
  });

  const pollArticle = useQuery({
    queryKey: ["article", pollingId],
    queryFn: async () => {
      if (!pollingId) throw new Error("Missing polling article id");
      return normalizeArticle(await fetchJson<unknown>(`/admin/articles/${pollingId}`));
    },
    enabled: Boolean(pollingId && isAllowed),
    refetchInterval: 7000
  });

  useEffect(() => {
    if (!pollingId || !pollArticle.data) return;
    if (Date.now() - pollStartedAt > 60000) {
      toast.error("Generation polling timed out after 60s.");
      setPollingId(null);
      return;
    }
    if (pollArticle.data.status !== "DRAFT" && pollArticle.data.status !== "REVISION_REQUESTED") {
      toast.success(`Article moved to ${pollArticle.data.status}.`);
      setPollingId(null);
      void queryClient.invalidateQueries({ queryKey: ["articles"] });
    }
  }, [pollArticle.data, pollingId, pollStartedAt, queryClient, toast]);

  const filtered = useMemo(() => (query.data?.items ?? []).filter((item) => item.title.toLowerCase().includes(search.toLowerCase())), [query.data?.items, search]);

  const actionMutation = useMutation<unknown, ActionMutationVariables>({
    mutationFn: (vars) => {
      if (!vars) throw new Error("Missing mutation variables");
      const { id, action, body } = vars;
      return fetchJson(`/admin/articles/${id}/actions/${action}`, { method: "POST", body });
    },
    onSuccess: () => {
      toast.success("Action completed.");
      void queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Action failed")
  });

  const runActionWithFallback = async ({
    id,
    attempts,
    successMessage
  }: {
    id: string;
    attempts: Array<{ action: string; body?: Record<string, string> }>;
    successMessage: string;
  }) => {
    let lastError: unknown;
    for (const attempt of attempts) {
      try {
        await fetchJson(`/admin/articles/${id}/actions/${attempt.action}`, { method: "POST", body: attempt.body });
        toast.success(successMessage);
        void queryClient.invalidateQueries({ queryKey: ["articles"] });
        return;
      } catch (error) {
        lastError = error;
      }
    }

    toast.error(lastError instanceof Error ? lastError.message : "Action failed");
  };

  const getActions = (item: Article): ArticleAction[] => {
    const actions: ArticleAction[] = [{ label: "View", href: `/admin/articles/view?id=${item.id}` }];

    if (item.status === "DRAFT") {
      actions.push({
        label: "Generate",
        onClick: () => {
          actionMutation.mutate({ id: item.id, action: "generate" });
          setPollingId(item.id);
          setPollStartedAt(Date.now());
        }
      });
    }

    if (item.status === "REVISION_REQUESTED") {
      actions.push({ label: "Edit", href: `/admin/articles/view?id=${item.id}` });
      actions.push({
        label: "Send for Approval",
        onClick: () => {
          actionMutation.mutate({ id: item.id, action: "generate" });
          setPollingId(item.id);
          setPollStartedAt(Date.now());
        }
      });
    }

    if (item.status === "AWAITING_APPROVAL") {
      actions.push({ label: "Approve", onClick: () => actionMutation.mutate({ id: item.id, action: "approve" }) });
      actions.push({
        label: "Revision Requested",
        onClick: () => {
          const revisionNote = prompt("Revision note") ?? "";
          void runActionWithFallback({
            id: item.id,
            successMessage: "Revision request sent.",
            attempts: [
              { action: "request-edits", body: { revisionNote } },
              { action: "request-edits", body: { note: revisionNote } },
              { action: "request-revision", body: { revisionNote } },
              { action: "request-revision", body: { note: revisionNote } },
              { action: "revision-requested", body: { revisionNote } }
            ]
          });
        }
      });
      actions.push({
        label: "Reject",
        onClick: () => {
          const reason = prompt("Rejection reason") ?? "";
          void runActionWithFallback({
            id: item.id,
            successMessage: "Article rejected.",
            attempts: [
              { action: "reject", body: { reason } },
              { action: "reject", body: { rejectionReason: reason } },
              { action: "reject", body: { note: reason } }
            ]
          });
        }
      });
    }

    if (item.status === "FAILED") {
      actions.push({ label: "Archive", onClick: () => actionMutation.mutate({ id: item.id, action: "archive" }) });
    }

    if (item.status === "APPROVED") {
      actions.push({
        label: "Mark Published",
        onClick: () => actionMutation.mutate({ id: item.id, action: "mark-published", body: { publishedAt: new Date().toISOString(), publishedUrl: "https://example.com" } })
      });
    }

    return actions;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="status-filter" className="text-sm font-medium text-slate-700">
          Status
        </label>
        <select
          id="status-filter"
          className="w-full rounded border p-2"
          value={status}
          onChange={(event) => setStatus(event.target.value as ArticleStatus)}
        >
          {ARTICLE_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <input className="w-full rounded border p-2" placeholder="Search title" value={search} onChange={(e) => setSearch(e.target.value)} />
      {pollingId && <p className="text-sm text-blue-600">Polling generation for article {pollingId}...</p>}
      <div className="overflow-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left dark:bg-slate-800"><tr><th className="p-2">Title</th><th>Status</th><th>UpdatedAt</th><th>Actions</th></tr></thead>
          <tbody>
            {query.isLoading ? <tr><td className="p-3" colSpan={4}>Loading...</td></tr> : filtered.map((item) => {
              const actions = getActions(item);
              const primaryMobileActions = actions.slice(0, 2);
              const overflowMobileActions = actions.slice(2);

              return (
                <tr key={item.id} className="border-t"><td className="p-2">{item.title}</td><td><StatusBadge status={item.status} /></td><td>{item.updatedAt ?? "-"}</td><td className="p-2">
                  <div className="hidden flex-wrap items-center gap-2 md:flex">
                    {actions.map((action, index) => renderAction(action, `${item.id}-desktop-${index}`))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:hidden">
                    {primaryMobileActions.map((action, index) => renderAction(action, `${item.id}-mobile-primary-${index}`))}
                    {overflowMobileActions.length > 0 && (
                      <details className="relative">
                        <summary className="cursor-pointer underline">More</summary>
                        <div className="absolute right-0 z-10 mt-1 flex min-w-40 flex-col gap-2 rounded border bg-white p-2 shadow dark:bg-slate-900">
                          {overflowMobileActions.map((action, index) => renderAction(action, `${item.id}-mobile-overflow-${index}`))}
                        </div>
                      </details>
                    )}
                  </div>
                </td></tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
