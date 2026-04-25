"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  Device,
  DeviceType,
  CreateDeviceBody,
  UpdateDeviceBody,
  ApiError,
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

const CAPABILITIES = [
  "turn_on",
  "turn_off",
  "toggle",
  "get_status",
  "set_brightness",
];

function toErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Unable to reach DeviceWeave API. Check your connection.";
}

// ─── Device Modal ─────────────────────────────────────────────────────────────

interface DeviceModalProps {
  open: boolean;
  initial: Device | null;
  onClose: () => void;
  onSubmit: (
    data: CreateDeviceBody | UpdateDeviceBody,
    isEdit: boolean,
  ) => void;
  busy: boolean;
  error: string;
}

function DeviceModal({
  open,
  initial,
  onClose,
  onSubmit,
  busy,
  error,
}: DeviceModalProps) {
  const isEdit = Boolean(initial);
  const dialogRef = useRef<HTMLFormElement>(null);
  useFocusTrap(dialogRef, open);

  const [form, setForm] = useState({
    device_id: "",
    name: "",
    device_type: "" as DeviceType | "",
    capabilities: [] as string[],
    ip: "",
    model: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        device_id: initial?.id ?? "",
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

  if (!open) return null;

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
    if (isEdit) {
      const body: UpdateDeviceBody = {
        name: form.name || undefined,
        device_type: (form.device_type as DeviceType) || undefined,
        capabilities: form.capabilities.length ? form.capabilities : undefined,
        ip: form.ip || undefined,
        model: form.model || undefined,
      };
      onSubmit(body, true);
    } else {
      const body: CreateDeviceBody = {
        device_id: form.device_id,
        name: form.name,
        device_type: (form.device_type as DeviceType) || undefined,
        capabilities: form.capabilities.length ? form.capabilities : undefined,
        ip: form.ip || undefined,
        model: form.model || undefined,
      };
      onSubmit(body, false);
    }
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
          {isEdit ? "Edit Device" : "Add Device"}
        </h3>

        {error && (
          <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-3">
          {!isEdit && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                Device ID <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
                placeholder="e.g. living_room_fan"
                value={form.device_id}
                onChange={(e) =>
                  setForm((p) => ({ ...p, device_id: e.target.value }))
                }
                required
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
              placeholder="e.g. Living Room Fan"
              value={form.name}
              onChange={(e) =>
                setForm((p) => ({ ...p, name: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Device Type
            </label>
            <select
              className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
              value={form.device_type}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  device_type: e.target.value as DeviceType,
                }))
              }
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
            <label className="mb-2 block text-sm font-medium">
              Capabilities
            </label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {CAPABILITIES.map((cap) => (
                <label
                  key={cap}
                  className="flex cursor-pointer items-center gap-1.5 text-sm"
                >
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
              <label className="mb-1 block text-sm font-medium">
                IP Address{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
                placeholder="192.168.1.10"
                value={form.ip}
                onChange={(e) =>
                  setForm((p) => ({ ...p, ip: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Model{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
                placeholder="manual"
                value={form.model}
                onChange={(e) =>
                  setForm((p) => ({ ...p, model: e.target.value }))
                }
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
            {busy ? "Saving…" : isEdit ? "Save Changes" : "Add Device"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── DevicesTab ───────────────────────────────────────────────────────────────

export function DevicesTab() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Device | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);
  const [modalError, setModalError] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["devices"],
    queryFn: getDevices,
  });

  const devices = data?.devices ?? [];
  const filtered = devices.filter(
    (d) =>
      search === "" ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.device_type.toLowerCase().includes(search.toLowerCase()),
  );

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["devices"] });

  const createMutation = useMutation<Device, CreateDeviceBody>({
    mutationFn: (body: CreateDeviceBody | undefined) => {
      if (!body) return Promise.reject(new Error("Missing payload"));
      return createDevice(body);
    },
    onSuccess: () => {
      toast.success("Device created");
      setAddOpen(false);
      setModalError("");
      invalidate();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        setModalError("A device with this ID already exists");
      } else {
        setModalError(toErrorMessage(err));
      }
    },
  });

  const updateMutation = useMutation<unknown, { id: string; body: UpdateDeviceBody }>({
    mutationFn: (vars: { id: string; body: UpdateDeviceBody } | undefined) => {
      if (!vars) return Promise.reject(new Error("Missing payload"));
      return updateDevice(vars.id, vars.body);
    },
    onSuccess: () => {
      toast.success("Device updated");
      setEditTarget(null);
      setModalError("");
      invalidate();
    },
    onError: (err) => {
      setModalError(toErrorMessage(err));
    },
  });

  const deleteMutation = useMutation<unknown, string>({
    mutationFn: (id: string | undefined) => {
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

  const handleModalSubmit = (
    data: CreateDeviceBody | UpdateDeviceBody,
    isEdit: boolean,
  ) => {
    setModalError("");
    if (isEdit && editTarget) {
      updateMutation.mutate({ id: editTarget.id, body: data as UpdateDeviceBody });
    } else {
      createMutation.mutate(data as CreateDeviceBody);
    }
  };

  const isModalBusy = createMutation.isPending || updateMutation.isPending;
  const isModalOpen = addOpen || Boolean(editTarget);

  return (
    <div className="space-y-4">
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
        <button
          type="button"
          className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
          onClick={() => {
            setModalError("");
            setAddOpen(true);
          }}
        >
          Add Device
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded border bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500">
          {search ? "No devices match your search." : "No devices found."}
        </p>
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
                    <div className="font-mono text-xs text-slate-400">
                      {device.id}
                    </div>
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
                          <span
                            key={cap}
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-700"
                          >
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

      <DeviceModal
        open={isModalOpen}
        initial={editTarget}
        onClose={() => {
          setAddOpen(false);
          setEditTarget(null);
          setModalError("");
        }}
        onSubmit={handleModalSubmit}
        busy={isModalBusy}
        error={modalError}
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
        Deactivate <strong>{deleteTarget?.name}</strong>? It will no longer be
        controllable.
      </ConfirmDialog>
    </div>
  );
}
