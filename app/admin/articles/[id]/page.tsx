"use client";

export const dynamicParams = false;

export async function generateStaticParams() {
  return [];
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { CopyButton } from "@/components/admin/CopyButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { TextareaWithCopy } from "@/components/admin/TextareaWithCopy";
import { useToast } from "@/components/admin/ToastProvider";
import { fetchJson } from "@/lib/admin/api";
import { AdminEvent, Article } from "@/lib/admin/types";
import { useAdminAccess } from "@/components/admin/AdminGate";

export default function ArticleDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isAllowed } = useAdminAccess();
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  const articleQuery = useQuery({ queryKey: ["article", id], queryFn: () => fetchJson<Article>(`/admin/articles/${id}`), enabled: isAllowed });
  const eventsQuery = useQuery({ queryKey: ["events", id], queryFn: () => fetchJson<{ items: AdminEvent[] }>(`/admin/articles/${id}/events`), enabled: isAllowed });

  const { register, handleSubmit } = useForm<{ title: string; sourceInputs: string; tags: string; publishedAt: string; publishedUrl: string }>({
    values: {
      title: articleQuery.data?.title ?? "",
      sourceInputs: articleQuery.data?.sourceInputs?.join("\n") ?? "",
      tags: articleQuery.data?.tags?.join(",") ?? "",
      publishedAt: new Date().toISOString(),
      publishedUrl: articleQuery.data?.publishedUrl ?? ""
    }
  });

  const patchMutation = useMutation<Article, Record<string, unknown>>({
    mutationFn: (body?: Record<string, unknown>) => fetchJson<Article>(`/admin/articles/${id}`, { method: "PATCH", body: body ?? {} }),
    onSuccess: () => {
      toast.success("Article updated");
      void queryClient.invalidateQueries({ queryKey: ["article", id] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Update failed")
  });

  const actionMutation = useMutation({
    mutationFn: (vars?: { action: string; body?: unknown }) => {
      if (!vars) throw new Error("Missing mutation variables");
      return fetchJson(`/admin/articles/${id}/actions/${vars.action}`, { method: "POST", body: vars.body });
    },
    onSuccess: () => {
      toast.success("Action successful");
      void queryClient.invalidateQueries({ queryKey: ["article", id] });
      void queryClient.invalidateQueries({ queryKey: ["events", id] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Action failed")
  });

  const article = articleQuery.data;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4 rounded border p-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{article?.title ?? "Loading..."}</h2>
          {article && <StatusBadge status={article.status} />}
          <p className="text-xs text-slate-500">Created: {article?.createdAt ?? "-"} · Updated: {article?.updatedAt ?? "-"}</p>
        </div>
        <form className="space-y-2" onSubmit={handleSubmit((v) => patchMutation.mutate({ title: v.title, sourceInputs: v.sourceInputs.split("\n").filter(Boolean), tags: v.tags.split(",").map((t) => t.trim()).filter(Boolean) }))}>
          <input className="w-full rounded border p-2" {...register("title")} />
          <textarea className="min-h-24 w-full rounded border p-2" {...register("sourceInputs")} />
          <input className="w-full rounded border p-2" {...register("tags")} />
          <button className="rounded bg-slate-900 px-3 py-2 text-white" type="submit" disabled={patchMutation.isPending}>Save Fields</button>
        </form>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded border px-2 py-1" onClick={() => actionMutation.mutate({ action: "generate" })}>Generate Draft</button>
          <button type="button" className="rounded border px-2 py-1" onClick={() => actionMutation.mutate({ action: "approve" })}>Approve</button>
          <button type="button" className="rounded border px-2 py-1" onClick={() => { const revisionNote = prompt("Revision note") ?? ""; if (revisionNote) actionMutation.mutate({ action: "request-edits", body: { revisionNote } }); }}>Request Edits</button>
          <button type="button" className="rounded border px-2 py-1" onClick={() => { const reason = prompt("Rejection reason") ?? ""; if (reason) actionMutation.mutate({ action: "reject", body: { reason } }); }}>Reject</button>
          <button type="button" className="rounded border px-2 py-1" onClick={() => setPublishModalOpen(true)}>Mark Published</button>
        </div>
        <div>
          <h3 className="mb-2 font-semibold">Events</h3>
          <ul className="space-y-2 text-sm">
            {(eventsQuery.data?.items ?? []).slice().reverse().map((event, index) => (
              <li key={`${event.type}-${index}`} className="rounded border p-2">{event.createdAt ?? "-"} · {event.type} · {event.message ?? ""}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-4 rounded border p-4">
        <h3 className="font-semibold">Generated Preview</h3>
        <div className="space-y-2 rounded border p-2">
          <p><span className="font-medium">Topic:</span> {article?.generated?.weekly_hook?.topic ?? "-"}</p>
          <p><span className="font-medium">Why now 2026:</span> {article?.generated?.weekly_hook?.why_now_2026 ?? "-"}</p>
          <p><span className="font-medium">Angle:</span> {article?.generated?.weekly_hook?.angle ?? "-"}</p>
        </div>
        <TextareaWithCopy label="LinkedIn Post" value={article?.generated?.linkedin_post} />
        <div className="space-y-2">
          <div className="flex items-center justify-between"><p className="font-medium">Hashtags</p><CopyButton text={(article?.generated?.hashtags ?? []).join(" ")} /></div>
          <p className="text-sm">{(article?.generated?.hashtags ?? []).join(" ") || "-"}</p>
        </div>
        <div className="space-y-2">
          <p className="font-medium">Sources</p>
          <ul className="list-disc pl-6 text-sm">
            {(article?.generated?.sources ?? []).map((source) => <li key={source}><a href={source} className="text-blue-600 underline" target="_blank" rel="noreferrer">{source}</a></li>)}
          </ul>
        </div>
      </div>

      <ConfirmModal open={publishModalOpen} title="Mark Published" onCancel={() => setPublishModalOpen(false)} onConfirm={handleSubmit((v) => { actionMutation.mutate({ action: "mark-published", body: { publishedAt: v.publishedAt, publishedUrl: v.publishedUrl } }); setPublishModalOpen(false); })}>
        <div className="space-y-2">
          <input className="w-full rounded border p-2" type="datetime-local" {...register("publishedAt")} />
          <input className="w-full rounded border p-2" placeholder="Published URL" {...register("publishedUrl")} />
        </div>
      </ConfirmModal>
    </div>
  );
}
