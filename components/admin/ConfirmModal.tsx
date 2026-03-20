"use client";

import { ReactNode, useRef, useEffect } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export function ConfirmModal({
  open,
  title,
  children,
  onCancel,
  onConfirm,
  confirmText = "Confirm",
  busy,
}: {
  open: boolean;
  title: string;
  children?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  busy?: boolean;
}) {
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div ref={dialogRef} className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl dark:bg-slate-900">
        <h3 id="confirm-modal-title" className="text-lg font-semibold">{title}</h3>
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{children}</div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="focus-ring rounded border px-3 py-2 text-sm"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="focus-ring rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
            onClick={onConfirm}
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? "Working..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
