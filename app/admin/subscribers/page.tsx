"use client";

import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/admin/ToastProvider";
import { fetchJson } from "@/lib/admin/api";
import { Subscriber } from "@/lib/admin/types";
import { useAdminAccess } from "@/components/admin/AdminGate";

export default function SubscribersPage() {
  const { register, handleSubmit, reset } = useForm<{ email: string }>();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isAllowed } = useAdminAccess();

  const subscribers = useQuery({ queryKey: ["subscribers"], queryFn: () => fetchJson<{ items: Subscriber[] }>("/admin/subscribers"), enabled: isAllowed });

  const addMutation = useMutation({
    mutationFn: (email?: string) => {
      if (!email) throw new Error("Missing email");
      return fetchJson("/admin/subscribers", { method: "POST", body: { email } });
    },
    onSuccess: () => { toast.success("Subscriber added"); reset(); void queryClient.invalidateQueries({ queryKey: ["subscribers"] }); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Add failed")
  });

  const deleteMutation = useMutation({
    mutationFn: (email?: string) => {
      if (!email) throw new Error("Missing email");
      return fetchJson(`/admin/subscribers/${encodeURIComponent(email)}`, { method: "DELETE" });
    },
    onSuccess: () => { toast.success("Subscriber removed"); void queryClient.invalidateQueries({ queryKey: ["subscribers"] }); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Delete failed")
  });

  return (
    <div className="space-y-4">
      <form className="flex gap-2" onSubmit={handleSubmit((v) => addMutation.mutate(v.email))}>
        <input className="w-full rounded border p-2" type="email" placeholder="Email" {...register("email", { required: true })} />
        <button className="rounded bg-slate-900 px-3 py-2 text-white" disabled={addMutation.isPending}>Add</button>
      </form>
      <ul className="space-y-2">
        {(subscribers.data?.items ?? []).map((item) => (
          <li key={item.email} className="flex items-center justify-between rounded border p-2 text-sm">
            <div><p>{item.email}</p><p className="text-xs text-slate-500">{item.status} · {item.createdAt}</p></div>
            <button className="rounded border px-2 py-1" onClick={() => deleteMutation.mutate(item.email)} disabled={deleteMutation.isPending}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
