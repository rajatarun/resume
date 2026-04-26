"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDevices,
  updateDevice,
  deleteDevice,
  getProviders,
  ingestDevices,
  Device,
  DeviceType,
  UpdateDeviceBody,
  ApiError,
  UpdateDeviceResponse,
  ProviderRenameStatus,
} from "@/lib/deviceweave";
import { useToast } from "@/components/admin/ToastProvider";
import { ConfirmDialog } from "@/components/admin/agent-management/shared/ConfirmDialog";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const DEVICE_TYPES: DeviceType[] = [
  "SmartBulb",
  "SmartPlug",
  "SmartAC",
  "SmartFan",
  "SmartHeater",
  "SmartSwitch",
];

const CAPABILITIES = ["turn_on", "turn_off", "toggle", "get_status", "set_brightness"];

function toErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Unable to reach DeviceWeave API. Check your connection.";
}

type RenameFeedback = Record<string, ProviderRenameStatus>;

function RenameStatusChips({
  feedback,
  providerDisplayMap,
}: {
  feedback: RenameFeedback;
  providerDisplayMap: Record<string, string>;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {Object.entries(feedback).map(([providerKey, status]) => {
        const providerName = providerDisplayMap[providerKey] ?? providerKey;
        if (status === "synced") {
          return (
            <span
              key={providerKey}
              className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
            >
              Synced to {providerName}
            </span>
          );
        }

        if (status === "registry_only") {
          return (
            <span
              key={providerKey}
              className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-300"
            >
              Registry only — {providerName} does not support rename
            </span>
          );
        }

        const reason = status.replace("failed: ", "");
        return (
          <span
            key={providerKey}
            title={reason}
            className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800 dark:bg-amber-900 dark:text-amber-300"
          >
            Sync failed — name saved locally
          </span>
        );
      })}
    </div>
  );
}

interface DeviceModalProps {
  open: boolean;
  initial: Device | null;
  onClose: () => void;
  onSubmit: (data: UpdateDeviceBody) => void;
  busy: boolean;
  error: string;
  renameFeedback: RenameFeedback | null;
  providerDisplayMap: Record<string, string>;
}

function DeviceModal({
  open,
  initial,
  onClose,
  onSubmit,
  busy,
  error,
  renameFeedback,
  providerDisplayMap,
}: DeviceModalProps) {
  const dialogRef = useRef<HTMLFormElement>(null);
  useFocusTrap(dialogRef, open);

  const [form, setForm] = useState({
    name: "",
    device_type: "" as DeviceType | "",
    capabilities: [] as string[],
    ip: "",
    model: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? "",
        device_type: initial?.device_type ?? "",
        capabilities: initial?.capabilities ?? [],
        ip: "",
        model: "",
      });
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, busy, onClose]);

  if (!open || !initial) return null;

  const toggleCap = (cap: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      capabilities: checked
        ? [...prev.capabilities, cap]
        : prev.capabilities.filter((c) => c !== cap),
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const body: UpdateDeviceBody = {};

    if (form.name !== initial.name) body.name = form.name;
    if (form.device_type && form.device_type !== initial.device_type) {
      body.device_type = form.device_type;
    }

    const sameCaps =
      form.capabilities.length === initial.capabilities.length &&
      form.capabilities.every((cap) => initial.capabilities.includes(cap));
    if (!sameCaps) body.capabilities = form.capabilities;

    if (form.ip) body.ip = form.ip;
    if (form.model) body.model = form.model;

    onSubmit(body);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="device-modal-title"
    >
      <form
        ref={dialogRef}
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900"
      >
        <h3 id="device-modal-title" className="text-lg font-semibold">
          Edit Device
        </h3>

        {error && (
          <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="device-modal-name" className="mb-1 block text-sm font-medium">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="device-modal-name"
              className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label htmlFor="device-modal-type" className="mb-1 block text-sm font-medium">
              Device Type
            </label>
            <select
              id="device-modal-type"
              className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
              value={form.device_type}
              onChange={(e) => setForm((p) => ({ ...p, device_type: e.target.value as DeviceType }))}
            >
              <option value="">Select type…</option>
              {DEVICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium">Capabilities</span>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {CAPABILITIES.map((cap) => (
                <label key={cap} className="flex cursor-pointer items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={form.capabilities.includes(cap)}
                    onChange={(e) => toggleCap(cap, e.target.checked)}
                  />
                  {cap}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="device-modal-ip" className="mb-1 block text-sm font-medium">
                IP Address <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="device-modal-ip"
                className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
                placeholder="192.168.1.10"
                value={form.ip}
                onChange={(e) => setForm((p) => ({ ...p, ip: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="device-modal-model" className="mb-1 block text-sm font-medium">
                Model <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="device-modal-model"
                className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
                value={form.model}
                onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded border px-3 py-2 text-sm disabled:opacity-50"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? "Saving…" : "Save Changes"}
          </button>
        </div>

        {renameFeedback && (
          <RenameStatusChips feedback={renameFeedback} providerDisplayMap={providerDisplayMap} />
        )}
      </form>
    </div>
  );
}

export function DevicesTab() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<Device | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);
  const [modalError, setModalError] = useState("");
  const [renameFeedback, setRenameFeedback] = useState<RenameFeedback | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["devices"],
    queryFn: getDevices,
  });

  const { data: providersData } = useQuery({
    queryKey: ["providers"],
    queryFn: getProviders,
  });

  const providerDisplayMap = useMemo(
    () =>
      Object.fromEntries((providersData?.providers ?? []).map((provider) => [provider.name, provider.display_name])),
    [providersData?.providers],
  );

  const showRegistryError = isError && error instanceof ApiError && error.status === 503;

  const devices = data?.devices ?? [];
  const filtered = devices.filter(
    (d) =>
      search === "" ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.device_type.toLowerCase().includes(search.toLowerCase()),
  );

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["devices"] });

  const syncMutation = useMutation({
    mutationFn: () => ingestDevices(),
    onSuccess: () => {
      toast.success("Sync complete");
      invalidate();
    },
    onError: (err) => {
      toast.error(toErrorMessage(err));
    },
  });

  const updateMutation = useMutation<UpdateDeviceResponse, { id: string; body: UpdateDeviceBody }>({
    mutationFn: (vars) => {
      if (!vars) return Promise.reject(new Error("Missing payload"));
      return updateDevice(vars.id, vars.body);
    },
    onSuccess: (response) => {
      toast.success("Device updated");
      setModalError("");
      setRenameFeedback(response.provider_rename ?? null);
      invalidate();
    },
    onError: (err) => {
      setModalError(toErrorMessage(err));
      setRenameFeedback(null);
    },
  });

  const deleteMutation = useMutation<unknown, string>({
    mutationFn: (id) => {
      if (!id) return Promise.reject(new Error("Missing ID"));
      return deleteDevice(id);
    },
    onSuccess: () => {
      toast.success("Device deactivated");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (err) => {
      toast.error(toErrorMessage(err));
      setDeleteTarget(null);
    },
  });

  const handleModalSubmit = (body: UpdateDeviceBody) => {
    setModalError("");
    if (!editTarget) return;
    updateMutation.mutate({ id: editTarget.id, body });
  };

  return (
    <div className="space-y-4">
      {showRegistryError ? (
        <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          ⚠ <strong>Device registry not configured.</strong> Set <code>DEVICE_REGISTRY_TABLE</code> and redeploy,
          then run <code>POST /ingest</code> to populate devices.
        </div>
      ) : (
        <>
          {isError && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {toErrorMessage(error)}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <input
              className="rounded border px-3 py-2 text-sm"
              placeholder="Search by name or type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {["sk1", "sk2", "sk3", "sk4", "sk5"].map((k) => (
                <div key={k} className="h-10 animate-pulse rounded border bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="space-y-2 rounded border border-dashed p-4">
              <p className="text-sm text-slate-700 dark:text-slate-200">No devices found.</p>
              <p className="text-sm text-slate-500">
                Run a sync to discover devices from your connected providers.
              </p>
              <button
                type="button"
                className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
              >
                {syncMutation.isPending ? "Syncing…" : "Sync now"}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-left">Capabilities</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((device) => (
                    <tr key={device.id} className="border-t">
                      <td className="p-2">
                        <div className="font-medium">{device.name}</div>
                        <div className="font-mono text-xs text-slate-400">{device.id_truncated ?? device.id}</div>
                      </td>
                      <td className="p-2">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-700">
                          {device.device_type || "—"}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {device.capabilities.length === 0 ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            device.capabilities.map((cap) => (
                              <span key={cap} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-700">
                                {cap}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            className="text-xs underline"
                            onClick={() => {
                              setModalError("");
                              setRenameFeedback(null);
                              setEditTarget(device);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-xs text-red-600 underline"
                            onClick={() => setDeleteTarget(device)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <DeviceModal
        open={Boolean(editTarget)}
        initial={editTarget}
        onClose={() => {
          setEditTarget(null);
          setModalError("");
          setRenameFeedback(null);
        }}
        onSubmit={handleModalSubmit}
        busy={updateMutation.isPending}
        error={modalError}
        renameFeedback={renameFeedback}
        providerDisplayMap={providerDisplayMap}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Deactivate device?"
        confirmText="Deactivate"
        busy={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      >
        Deactivate <strong>{deleteTarget?.name}</strong>? It will no longer be controllable.
      </ConfirmDialog>
    </div>
  );
}
