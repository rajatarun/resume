"use client";

import { ReactNode } from "react";

export function ConfirmModal({ open, title, children, onCancel, onConfirm, confirmText = "Confirm", busy }: { open: boolean; title: string; children?: ReactNode; onCancel: () => void; onConfirm: () => void; confirmText?: string; busy?: boolean }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl dark:bg-slate-900">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{children}</div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded border px-3 py-2 text-sm" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50" onClick={onConfirm} disabled={busy}>{busy ? "Working..." : confirmText}</button>
        </div>
      </div>
    </div>
  );
}
