"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDevices,
  getLearnings,
  deleteLearning,
  addLearning,
  Learning,
  Device,
  ApiError,
} from "@/lib/deviceweave";
import { useToast } from "@/components/admin/ToastProvider";
import { ConfirmDialog } from "@/components/admin/agent-management/shared/ConfirmDialog";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { format } from "date-fns";

function toErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Unable to reach DeviceWeave API. Check your connection.";
}

type SortField = keyof Pick<
  Learning,
  "phrase" | "device_id" | "source" | "confidence" | "use_count" | "created_at"
>;

// ─── Add Phrase Modal ─────────────────────────────────────────────────────────

function AddPhraseModal({
  open,
  devices,
  onClose,
  onSubmit,
  busy,
  error,
}: {
  open: boolean;
  devices: Device[];
  onClose: () => void;
  onSubmit: (device_id: string, phrase: string) => void;
  busy: boolean;
  error: string;
}) {
  const dialogRef = useRef<HTMLFormElement>(null);
  useFocusTrap(dialogRef, open);
  const [deviceId, setDeviceId] = useState("");
  const [phrase, setPhrase] = useState("");

  useEffect(() => {
    if (open) {
      setDeviceId("");
      setPhrase("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-phrase-modal-title"
    >
      <form
        ref={dialogRef}
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          onSubmit(deviceId, phrase);
        }}
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900"
      >
        <h3 id="add-phrase-modal-title" className="text-lg font-semibold">
          Add Phrase
        </h3>

        {error && (
          <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="add-phrase-device"
              className="mb-1 block text-sm font-medium"
            >
              Device <span className="text-red-500">*</span>
            </label>
            <select
              id="add-phrase-device"
              className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              required
            >
              <option value="">Select device…</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="add-phrase-text"
              className="mb-1 block text-sm font-medium"
            >
              Phrase <span className="text-red-500">*</span>
            </label>
            <input
              id="add-phrase-text"
              className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
              placeholder="e.g. turn on the office light"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              required
            />
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
            {busy ? "Saving…" : "Add Phrase"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── LearningsTab ─────────────────────────────────────────────────────────────

export function LearningsTab() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [phraseSearch, setPhraseSearch] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState<
    "all" | "learned" | "manual"
  >("all");
  const [groupByDevice, setGroupByDevice] = useState(false);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [deleteTarget, setDeleteTarget] = useState<Learning | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const pendingAddVarsRef = useRef<{ device_id: string; phrase: string } | null>(null);

  const { data: learningsData, isLoading: learningsLoading, isError: learningsError, error: learningsErr } = useQuery({
    queryKey: ["learnings"],
    queryFn: getLearnings,
  });

  const { data: devicesData } = useQuery({
    queryKey: ["devices"],
    queryFn: getDevices,
  });

  const learnings = learningsData?.learnings ?? [];
  const devices = devicesData?.devices ?? [];

  const deviceNameMap = Object.fromEntries(devices.map((d) => [d.id, d.name]));

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["learnings"] });

  const deleteMutation = useMutation<
    unknown,
    { device_id: string; phrase: string }
  >({
    mutationFn: (vars: { device_id: string; phrase: string } | undefined) => {
      if (!vars) return Promise.reject(new Error("Missing payload"));
      return deleteLearning(vars);
    },
    onSuccess: () => {
      toast.success("Phrase removed");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (err) => {
      toast.error(toErrorMessage(err));
      setDeleteTarget(null);
    },
  });

  const addMutation = useMutation<
    unknown,
    { device_id: string; phrase: string }
  >({
    mutationFn: (vars: { device_id: string; phrase: string } | undefined) => {
      if (!vars) return Promise.reject(new Error("Missing payload"));
      pendingAddVarsRef.current = vars;
      return addLearning(vars);
    },
    onSuccess: () => {
      const vars = pendingAddVarsRef.current;
      const deviceName = vars
        ? (deviceNameMap[vars.device_id] ?? vars.device_id)
        : "device";
      toast.success(`Phrase bound to ${deviceName}`);
      setAddOpen(false);
      setModalError("");
      invalidate();
    },
    onError: (err) => {
      setModalError(toErrorMessage(err));
    },
  });

  const filtered = learnings.filter((l) => {
    if (phraseSearch && !l.phrase.toLowerCase().includes(phraseSearch.toLowerCase())) return false;
    if (deviceFilter && l.device_id !== deviceFilter) return false;
    if (sourceFilter !== "all" && l.source !== sourceFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortField];
    const bv = b[sortField];
    const multiplier = sortDir === "asc" ? 1 : -1;
    if (typeof av === "number" && typeof bv === "number") {
      return (av - bv) * multiplier;
    }
    return String(av).localeCompare(String(bv)) * multiplier;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortIcon = (field: SortField) =>
    sortField === field ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  const grouped: Record<string, Learning[]> = {};
  if (groupByDevice) {
    sorted.forEach((l) => {
      const key = l.device_id;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(l);
    });
  }

  return (
    <div className="space-y-4">
      {learningsError && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {toErrorMessage(learningsErr)}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="rounded border px-3 py-2 text-sm"
          placeholder="Search phrases…"
          value={phraseSearch}
          onChange={(e) => setPhraseSearch(e.target.value)}
        />
        <select
          className="rounded border px-3 py-2 text-sm dark:bg-slate-900"
          value={deviceFilter}
          onChange={(e) => setDeviceFilter(e.target.value)}
        >
          <option value="">All devices</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          className="rounded border px-3 py-2 text-sm dark:bg-slate-900"
          value={sourceFilter}
          onChange={(e) =>
            setSourceFilter(e.target.value as "all" | "learned" | "manual")
          }
        >
          <option value="all">All sources</option>
          <option value="learned">Auto-learned</option>
          <option value="manual">Manual</option>
        </select>
        <label className="flex cursor-pointer items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={groupByDevice}
            onChange={(e) => setGroupByDevice(e.target.checked)}
          />
          Group by device
        </label>
        <button
          type="button"
          className="ml-auto rounded bg-slate-900 px-3 py-2 text-sm text-white"
          onClick={() => {
            setModalError("");
            setAddOpen(true);
          }}
        >
          Add Phrase
        </button>
      </div>

      {learningsLoading ? (
        <div className="space-y-2">
          {["sk1", "sk2", "sk3", "sk4", "sk5"].map((k) => (
            <div
              key={k}
              className="h-10 animate-pulse rounded border bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-slate-500">No learnings match your filters.</p>
      ) : groupByDevice ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([deviceId, rows]) => (
            <div key={deviceId}>
              <h3 className="mb-2 text-sm font-semibold">
                {deviceNameMap[deviceId] ?? deviceId}
              </h3>
              <LearningsTable
                rows={rows}
                deviceNameMap={deviceNameMap}
                sortIcon={sortIcon}
                onSort={handleSort}
                onDelete={setDeleteTarget}
              />
            </div>
          ))}
        </div>
      ) : (
        <LearningsTable
          rows={sorted}
          deviceNameMap={deviceNameMap}
          sortIcon={sortIcon}
          onSort={handleSort}
          onDelete={setDeleteTarget}
        />
      )}

      <AddPhraseModal
        open={addOpen}
        devices={devices}
        onClose={() => {
          setAddOpen(false);
          setModalError("");
        }}
        onSubmit={(device_id, phrase) =>
          addMutation.mutate({ device_id, phrase })
        }
        busy={addMutation.isPending}
        error={modalError}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove phrase?"
        confirmText="Remove"
        busy={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate({
              device_id: deleteTarget.device_id,
              phrase: deleteTarget.phrase,
            });
          }
        }}
      >
        Remove phrase &ldquo;<strong>{deleteTarget?.phrase}</strong>&rdquo; from{" "}
        <strong>
          {deleteTarget
            ? (deviceNameMap[deleteTarget.device_id] ?? deleteTarget.device_id)
            : ""}
        </strong>
        ?
      </ConfirmDialog>
    </div>
  );
}

function LearningsTable({
  rows,
  deviceNameMap,
  sortIcon,
  onSort,
  onDelete,
}: {
  rows: Learning[];
  deviceNameMap: Record<string, string>;
  sortIcon: (f: SortField) => string;
  onSort: (f: SortField) => void;
  onDelete: (l: Learning) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            <th className="p-2 text-left">
              <button
                type="button"
                className="font-semibold"
                onClick={() => onSort("phrase")}
              >
                Phrase{sortIcon("phrase")}
              </button>
            </th>
            <th className="p-2 text-left">
              <button
                type="button"
                className="font-semibold"
                onClick={() => onSort("device_id")}
              >
                Device{sortIcon("device_id")}
              </button>
            </th>
            <th className="p-2 text-left">
              <button
                type="button"
                className="font-semibold"
                onClick={() => onSort("source")}
              >
                Source{sortIcon("source")}
              </button>
            </th>
            <th className="p-2 text-left">
              <button
                type="button"
                className="font-semibold"
                onClick={() => onSort("confidence")}
              >
                Confidence{sortIcon("confidence")}
              </button>
            </th>
            <th className="p-2 text-left">
              <button
                type="button"
                className="font-semibold"
                onClick={() => onSort("use_count")}
              >
                Uses{sortIcon("use_count")}
              </button>
            </th>
            <th className="p-2 text-left">
              <button
                type="button"
                className="font-semibold"
                onClick={() => onSort("created_at")}
              >
                Created{sortIcon("created_at")}
              </button>
            </th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => (
            <tr key={`${l.device_id}::${l.phrase}`} className="border-t">
              <td className="p-2">{l.phrase}</td>
              <td className="p-2">{deviceNameMap[l.device_id] ?? l.device_id}</td>
              <td className="p-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    l.source === "manual"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-700"
                  }`}
                >
                  {l.source === "manual" ? "manual" : "auto"}
                </span>
              </td>
              <td className="p-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.round(l.confidence * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">
                    {Math.round(l.confidence * 100)}%
                  </span>
                </div>
              </td>
              <td className="p-2 text-right">{l.use_count}</td>
              <td className="p-2 text-xs text-slate-500">
                {format(new Date(l.created_at), "MMM d, yyyy")}
              </td>
              <td className="p-2">
                <button
                  type="button"
                  className="text-xs text-red-600 underline"
                  onClick={() => onDelete(l)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
