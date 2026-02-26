"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { TextareaWithCopy } from "@/components/admin/TextareaWithCopy";
import { useToast } from "@/components/admin/ToastProvider";
import { fetchJson } from "@/lib/admin/api";
import { useAdminAccess } from "@/components/admin/AdminGate";

export default function NewsletterPage() {
  const toast = useToast();
  const { isAllowed } = useAdminAccess();
  const [from, setFrom] = useState(new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [open, setOpen] = useState(false);

  const subscribers = useQuery({ queryKey: ["subscribers"], queryFn: () => fetchJson<{ items: { email: string }[] }>("/admin/subscribers"), enabled: isAllowed });

  const generate = useMutation({
    mutationFn: () => fetchJson<{ ok: boolean; preview: { subject: string; body_text: string; body_html: string } }>("/admin/newsletter/actions/generate", { method: "POST", body: { from, to } }),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Generate failed")
  });

  const send = useMutation({
    mutationFn: () => fetchJson("/admin/newsletter/actions/send", { method: "POST", body: generate.data?.preview }),
    onSuccess: () => { toast.success("Newsletter sent."); setOpen(false); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Send failed")
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <input type="date" className="rounded border p-2" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" className="rounded border p-2" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <p className="text-sm">Subscriber count: {subscribers.data?.items.length ?? 0}</p>
      <div className="flex gap-2">
        <button className="rounded bg-slate-900 px-3 py-2 text-white" onClick={() => generate.mutate()} disabled={generate.isPending}>Generate Preview</button>
        <button className="rounded border px-3 py-2" disabled={!generate.data?.preview} onClick={() => setOpen(true)}>Send</button>
      </div>
      {generate.data?.preview && (
        <div className="space-y-3 rounded border p-3">
          <TextareaWithCopy label="Subject" value={generate.data.preview.subject} />
          <TextareaWithCopy label="Body (text)" value={generate.data.preview.body_text} />
          <TextareaWithCopy label="Body (HTML)" value={generate.data.preview.body_html} />
        </div>
      )}
      <ConfirmModal open={open} onCancel={() => setOpen(false)} onConfirm={() => send.mutate()} title="Send newsletter?" confirmText="Send" busy={send.isPending}>
        This will send the generated newsletter to active subscribers.
      </ConfirmModal>
    </div>
  );
}
