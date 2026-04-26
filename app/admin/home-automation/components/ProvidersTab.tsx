"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getProviders, ingestDevices, ApiError } from "@/lib/deviceweave";
import { useToast } from "@/components/admin/ToastProvider";

function toErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Unable to reach DeviceWeave API. Check your connection.";
}

export function ProvidersTab() {
  const toast = useToast();
  const [activeSyncProvider, setActiveSyncProvider] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["providers"],
    queryFn: getProviders,
  });

  const syncMutation = useMutation<{ name: string; display_name: string }, { name: string; display_name: string }>({
    mutationFn: (provider) => {
      if (!provider) return Promise.reject(new Error("Missing provider"));
      return ingestDevices({ provider: provider.name }).then(() => provider);
    },
    onSuccess: (provider) => {
      setActiveSyncProvider(null);
      toast.success(`Sync complete — ${provider.display_name}`);
    },
    onError: (err) => {
      setActiveSyncProvider(null);
      toast.error(`Sync failed — ${toErrorMessage(err)}`);
    },
  });

  return (
    <div className="space-y-4">
      {isError && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {toErrorMessage(error)}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-3">
          {["pk1", "pk2", "pk3"].map((k) => (
            <div key={k} className="h-56 animate-pulse rounded border bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {(data?.providers ?? []).map((provider) => {
            const syncing = syncMutation.isPending && activeSyncProvider === provider.name;
            return (
              <div key={provider.name} className="flex flex-col rounded border p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{provider.display_name}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      provider.configured
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {provider.configured ? "Connected" : "Not configured"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {provider.device_types.map((deviceType) => (
                    <span
                      key={deviceType}
                      className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                    >
                      {deviceType}
                    </span>
                  ))}
                </div>

                <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                  {provider.supports_rename
                    ? "Renaming devices syncs to the physical device."
                    : "Renaming updates the registry only."}
                </p>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                    onClick={() => {
                      setActiveSyncProvider(provider.name);
                      syncMutation.mutate(provider);
                    }}
                    disabled={syncMutation.isPending}
                  >
                    {syncing ? "Syncing…" : `Sync ${provider.display_name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
