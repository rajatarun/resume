"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArticleFormModal } from "@/components/admin/ArticleFormModal";
import { useToast } from "@/components/admin/ToastProvider";
import { fetchJson } from "@/lib/admin/api";
import { ARTICLE_STATUSES, Article } from "@/lib/admin/types";
import { useAdminAccess } from "@/components/admin/AdminGate";

export default function AdminDashboardPage() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();
  const { address, isAllowed } = useAdminAccess();

  const health = useQuery({ queryKey: ["health"], queryFn: () => fetchJson<{ ok: boolean }>("/admin"), enabled: isAllowed });

  const statusQueries = useQueries({
    queries: ARTICLE_STATUSES.map((status) => ({
      queryKey: ["articles", status],
      queryFn: () => fetchJson<{ items: Article[] }>(`/admin/articles?status=${status}&limit=100`),
      enabled: isAllowed
    }))
  });

  const counts = useMemo(
    () => ARTICLE_STATUSES.map((status, i) => ({ status, count: statusQueries[i]?.data?.items.length ?? 0 })),
    [statusQueries]
  );

  const createDraft = useMutation({
    mutationFn: (payload: { title: string; sourceInputs?: string[]; tags?: string[]; status?: string }) => fetchJson<Article>("/admin/articles", { method: "POST", body: payload }),
    onSuccess: () => {
      toast.success("Draft created.");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to create draft.")
  });

  return (
    <div className="space-y-4">
      <p className="text-sm">Connected wallet: <span className="font-mono">{address}</span></p>
      <div className="rounded border p-3">Health: {health.isLoading ? "Checking..." : health.isError ? "Error" : health.data?.ok ? "OK" : "Unknown"}</div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {counts.map((item) => (
          <div key={item.status} className="rounded border p-3">
            <p className="text-xs text-slate-500">{item.status}</p>
            <p className="text-2xl font-bold">{item.count}</p>
          </div>
        ))}
      </div>
      <button className="rounded bg-slate-900 px-3 py-2 text-white" onClick={() => setOpen(true)}>Create Draft</button>
      <ArticleFormModal open={open} onClose={() => setOpen(false)} onSubmit={(v) => createDraft.mutate(v)} busy={createDraft.isPending} />
    </div>
  );
}
