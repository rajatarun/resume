"use client";

import { useEffect, useRef } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface DeleteTaskDialogProps {
  taskName: string | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteTaskDialog({ taskName, busy, onCancel, onConfirm }: DeleteTaskDialogProps) {
  const open = taskName !== null;
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, busy, onCancel]);

  if (!open || !taskName) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-task-title"
    >
      <div ref={dialogRef} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h3 id="delete-task-title" className="text-lg font-semibold text-red-600">
          Delete {taskName}?
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          This removes the task from S3 and its EventBridge cron rule. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-slate-800"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
            onClick={onConfirm}
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
