"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPresence, setPresence, ApiError } from "@/lib/deviceweave";
import { useToast } from "@/components/admin/ToastProvider";
import { formatDistanceToNow } from "date-fns";

export function PresenceBar() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["presence"],
    queryFn: getPresence,
  });

  const currentIsHome = optimistic ?? data?.is_home ?? false;

  const toggle = async () => {
    if (isLoading || saving) return;
    const next = !currentIsHome;
    setOptimistic(next);
    setSaving(true);
    try {
      await setPresence({ is_home: next });
      setOptimistic(null);
      void queryClient.invalidateQueries({ queryKey: ["presence"] });
    } catch (err) {
      setOptimistic(null);
      toast.error(
        err instanceof ApiError ? err.message : "Failed to update presence.",
      );
    } finally {
      setSaving(false);
    }
  };

  const updatedAt = data?.updated_at;
  const relativeTime = updatedAt
    ? formatDistanceToNow(new Date(updatedAt), { addSuffix: true })
    : null;

  return (
    <div className="flex items-center gap-4 rounded border bg-slate-50 px-4 py-3 dark:bg-slate-800">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Occupancy</span>
        <button
          type="button"
          role="switch"
          aria-checked={currentIsHome}
          onClick={() => void toggle()}
          disabled={isLoading || saving}
          aria-label={currentIsHome ? "Home — click to set Away" : "Away — click to set Home"}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
            currentIsHome ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
              currentIsHome ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span
          className={`text-sm font-semibold ${
            currentIsHome ? "text-emerald-600" : "text-slate-500"
          }`}
        >
          {currentIsHome ? "Home" : "Away"}
        </span>
      </div>
      {isError && (
        <span className="text-xs text-red-600">
          Unable to load presence status.
        </span>
      )}
      {relativeTime && (
        <span className="ml-auto text-xs text-slate-400">
          Updated {relativeTime}
        </span>
      )}
    </div>
  );
}
