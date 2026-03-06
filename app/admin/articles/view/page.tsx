"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { CopyButton } from "@/components/admin/CopyButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { TextareaWithCopy } from "@/components/admin/TextareaWithCopy";
import { useToast } from "@/components/admin/ToastProvider";
import { fetchJson } from "@/lib/admin/api";
import { AdminEvent, Article, normalizeArticle } from "@/lib/admin/types";
import { useAdminAccess } from "@/components/admin/AdminGate";

export default function ArticleDetailViewPage() {
  type ActionVars = { action: string; body?: unknown };
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isAllowed } = useAdminAccess();
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [selectedDraftIndex, setSelectedDraftIndex] = useState(0);

  const articleQuery = useQuery({
    queryKey: ["article", id],
    queryFn: async () => normalizeArticle(await fetchJson<unknown>(`/admin/articles/${id}`)),
    enabled: Boolean(id && isAllowed)
  });

  const eventsQuery = useQuery({
    queryKey: ["events", id],
    queryFn: () => fetchJson<{ items: AdminEvent[] }>(`/admin/articles/${id}/events`),
    enabled: Boolean(id && isAllowed)
  });

  const { register, handleSubmit, reset } = useForm<{
    title: string;
    sourceInputs: string;
    tags: string;
    publishedAt: string;
    publishedUrl: string;
  }>({
    defaultValues: {
      title: "",
      sourceInputs: "",
      tags: "",
      publishedAt: new Date().toISOString(),
      publishedUrl: ""
    }
  });

  useEffect(() => {
    if (!articleQuery.data) return;

    reset({
      title: articleQuery.data.title,
      sourceInputs: articleQuery.data.sourceInputs?.join("\n") ?? "",
      tags: articleQuery.data.tags?.join(",") ?? "",
      publishedAt: new Date().toISOString(),
      publishedUrl: articleQuery.data.publishedUrl ?? ""
    });
  }, [articleQuery.data, reset]);

  const article = articleQuery.data;

  useEffect(() => {
    setSelectedDraftIndex(0);
  }, [article?.id, article?.drafts?.length]);

  const patchMutation = useMutation<Article, Record<string, unknown> | undefined>({
    mutationFn: async (body) =>
      normalizeArticle(await fetchJson<unknown>(`/admin/articles/${id}`, { method: "PATCH", body: body ?? {} })),
    onSuccess: () => {
      toast.success("Article updated");
      void queryClient.invalidateQueries({ queryKey: ["article", id] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Update failed")
  });

  const actionMutation = useMutation<unknown, ActionVars | undefined>({
    mutationFn: (vars) => {
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

  const runActionWithFallback = async ({
    attempts,
    successMessage
  }: {
    attempts: Array<{ action: string; body?: Record<string, string> }>;
    successMessage: string;
  }) => {
    let lastError: unknown;
    for (const attempt of attempts) {
      try {
        await fetchJson(`/admin/articles/${id}/actions/${attempt.action}`, { method: "POST", body: attempt.body });
        toast.success(successMessage);
        void queryClient.invalidateQueries({ queryKey: ["article", id] });
        void queryClient.invalidateQueries({ queryKey: ["events", id] });
        return;
      } catch (error) {
        lastError = error;
      }
    }

    toast.error(lastError instanceof Error ? lastError.message : "Action failed");
  };

  const selectedDraft = article?.drafts?.[selectedDraftIndex];
  const preview = selectedDraft ?? article?.generated;

  if (!id) {
    return (
      <div className="rounded border p-4 text-sm">
        Missing <code>?id=</code> in URL.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/admin/articles" className="inline-flex items-center rounded border px-3 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
        ← Back to Articles
      </Link>

      <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4 rounded border p-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{article?.title ?? "Loading..."}</h2>
          {article && <StatusBadge status={article.status} />}
          <p className="text-xs text-slate-500">
            Created: {article?.createdAt ?? "-"} · Updated: {article?.updatedAt ?? "-"}
          </p>
        </div>

        <form
          className="space-y-2"
          onSubmit={handleSubmit((v) =>
            patchMutation.mutate({
              title: v.title,
              sourceInputs: v.sourceInputs.split("\n").filter(Boolean),
              tags: v.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            })
          )}
        >
          <input className="w-full rounded border p-2" {...register("title")} />
          <textarea className="min-h-24 w-full rounded border p-2" {...register("sourceInputs")} />
          <input className="w-full rounded border p-2" {...register("tags")} />
          <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-white" disabled={patchMutation.isPending}>
            Save Fields
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded border px-2 py-1" onClick={() => actionMutation.mutate({ action: "generate" })}>
            Generate Draft
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1"
            onClick={() => {
              if (!selectedDraft || !article?.drafts?.length) {
                actionMutation.mutate({ action: "approve" });
                return;
              }

              void runActionWithFallback({
                successMessage: "Draft approved.",
                attempts: [
                  { action: "approve", body: { draftIndex: String(selectedDraftIndex) } },
                  { action: "approve", body: { index: String(selectedDraftIndex) } },
                  { action: "approve", body: { draft: JSON.stringify(selectedDraft) } },
                  { action: "approve" }
                ]
              });
            }}
          >
            Approve
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1"
            onClick={() => {
              const revisionNote = prompt("Revision note") ?? "";
              void runActionWithFallback({
                successMessage: "Revision request sent.",
                attempts: [
                  { action: "request-edits", body: { revisionNote } },
                  { action: "request-edits", body: { note: revisionNote } },
                  { action: "request-revision", body: { revisionNote } },
                  { action: "request-revision", body: { note: revisionNote } },
                  { action: "revision-requested", body: { revisionNote } }
                ]
              });
            }}
          >
            Request Edits
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1"
            onClick={() => {
              const reason = prompt("Rejection reason") ?? "";
              void runActionWithFallback({
                successMessage: "Article rejected.",
                attempts: [
                  { action: "reject", body: { reason } },
                  { action: "reject", body: { rejectionReason: reason } },
                  { action: "reject", body: { note: reason } }
                ]
              });
            }}
          >
            Reject
          </button>
          <button type="button" className="rounded border px-2 py-1" onClick={() => setPublishModalOpen(true)}>
            Mark Published
          </button>
        </div>

        <div>
          <h3 className="mb-2 font-semibold">Events</h3>
          <ul className="space-y-2 text-sm">
            {(eventsQuery.data?.items ?? [])
              .slice()
              .reverse()
              .map((event, index) => (
                <li key={`${event.type}-${index}`} className="rounded border p-2">
                  {event.createdAt ?? "-"} · {event.type} · {event.message ?? ""}
                </li>
              ))}
          </ul>
        </div>
      </div>

      <div className="space-y-4 rounded border p-4">
        <h3 className="font-semibold">Generated Preview</h3>

        {article?.drafts && article.drafts.length > 0 ? (
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="draft-selector">
              Draft
            </label>
            <select
              id="draft-selector"
              className="w-full rounded border p-2"
              value={selectedDraftIndex}
              onChange={(event) => setSelectedDraftIndex(Number(event.target.value))}
            >
              {article.drafts.map((_, index) => (
                <option key={`draft-${index}`} value={index}>
                  {index + 1}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="space-y-2 rounded border p-2">
          <p>
            <span className="font-medium">Topic:</span> {preview?.weekly_hook?.topic ?? "-"}
          </p>
          <p>
            <span className="font-medium">Why now 2026:</span> {preview?.weekly_hook?.why_now_2026 ?? "-"}
          </p>
          <p>
            <span className="font-medium">Angle:</span> {preview?.weekly_hook?.angle ?? "-"}
          </p>
        </div>

        <TextareaWithCopy label="LinkedIn Post" value={preview?.linkedin_post} />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium">Hashtags</p>
            <CopyButton text={(preview?.hashtags ?? []).join(" ")} />
          </div>
          <p className="text-sm">{(preview?.hashtags ?? []).join(" ") || "-"}</p>
        </div>

        <div className="space-y-2">
          <p className="font-medium">Sources</p>
          <ul className="list-disc pl-6 text-sm">
            {(preview?.sources ?? []).map((source) => (
              <li key={source}>
                <a href={source} className="text-blue-600 underline" target="_blank" rel="noreferrer">
                  {source}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ConfirmModal
        open={publishModalOpen}
        title="Mark Published"
        onCancel={() => setPublishModalOpen(false)}
        onConfirm={handleSubmit((v) => {
          actionMutation.mutate({ action: "mark-published", body: { publishedAt: v.publishedAt, publishedUrl: v.publishedUrl } });
          setPublishModalOpen(false);
        })}
      >
        <div className="space-y-2">
          <input className="w-full rounded border p-2" type="datetime-local" {...register("publishedAt")} />
          <input className="w-full rounded border p-2" placeholder="Published URL" {...register("publishedUrl")} />
        </div>
      </ConfirmModal>
      </div>
    </div>
  );
}
