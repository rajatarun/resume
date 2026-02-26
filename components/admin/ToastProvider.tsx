"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: number; kind: "success" | "error"; message: string };

const ToastContext = createContext<{ success: (m: string) => void; error: (m: string) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((kind: Toast["kind"], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3000);
  }, []);

  const value = useMemo(
    () => ({ success: (m: string) => push("success", m), error: (m: string) => push("error", m) }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className={`rounded-lg px-3 py-2 text-sm text-white shadow ${toast.kind === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
