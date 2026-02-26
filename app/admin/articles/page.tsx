"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useToast } from "@/components/admin/ToastProvider";
import { fetchJson } from "@/lib/admin/api";
import { ARTICLE_STATUSES, Article, ArticleStatus } from "@/lib/admin/types";
import { useAdminAccess } from "@/components/admin/AdminGate";

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
    queryFn: () => fetchJson<{ items: Article[] }>(`/admin/articles?status=${status}&limit=100`),
    enabled: isAllowed
  });

  const pollArticle = useQuery({
    queryKey: ["article", pollingId],
    queryFn: () => fetchJson<Article>(`/admin/articles/${pollingId}`),
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

  const actionMutation = useMutation<unknown, Error>({
    mutationFn: ({ id, action, body }: ActionMutationVariables) => fetchJson(`/admin/articles/${id}/actions/${action}`, { method: "POST", body }),
    onSuccess: () => {
      toast.success("Action completed.");
      void queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Action failed")
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ARTICLE_STATUSES.map((item) => (
          <button key={item} className={`rounded border px-3 py-1 text-sm ${item === status ? "bg-slate-900 text-white" : ""}`} onClick={() => setStatus(item)}>{item}</button>
        ))}
      </div>
      <input className="w-full rounded border p-2" placeholder="Search title" value={search} onChange={(e) => setSearch(e.target.value)} />
      {pollingId && <p className="text-sm text-blue-600">Polling generation for article {pollingId}...</p>}
      <div className="overflow-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left dark:bg-slate-800"><tr><th className="p-2">Title</th><th>Status</th><th>UpdatedAt</th><th>Actions</th></tr></thead>
          <tbody>
            {query.isLoading ? <tr><td className="p-3" colSpan={4}>Loading...</td></tr> : filtered.map((item) => (
              <tr key={item.id} className="border-t"><td className="p-2">{item.title}</td><td><StatusBadge status={item.status} /></td><td>{item.updatedAt ?? "-"}</td><td className="space-x-2 p-2">
                <Link className="underline" href={`/admin/articles/${item.id}`}>View</Link>
                {(["DRAFT", "REVISION_REQUESTED"] as string[]).includes(item.status) && <button disabled={actionMutation.isPending} onClick={() => { actionMutation.mutate({ id: item.id, action: "generate" }); setPollingId(item.id); setPollStartedAt(Date.now()); }} className="underline">Generate</button>}
                {item.status === "AWAITING_APPROVAL" && <button disabled={actionMutation.isPending} className="underline" onClick={() => actionMutation.mutate({ id: item.id, action: "approve" })}>Approve</button>}
                {item.status === "APPROVED" && <button disabled={actionMutation.isPending} className="underline" onClick={() => actionMutation.mutate({ id: item.id, action: "mark-published", body: { publishedAt: new Date().toISOString(), publishedUrl: "https://example.com" } })}>Mark Published</button>}
              </td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
