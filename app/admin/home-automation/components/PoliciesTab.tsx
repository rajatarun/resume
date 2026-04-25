"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPolicies,
  authorPolicy,
  deletePolicy,
  Policy,
  PolicyDeviceType,
  ActionType,
  ApiError,
} from "@/lib/deviceweave";
import { useToast } from "@/components/admin/ToastProvider";
import { ConfirmDialog } from "@/components/admin/agent-management/shared/ConfirmDialog";
import { PolicyConditionChips } from "./PolicyConditionChips";
import { format } from "date-fns";

const POLICY_DEVICE_TYPES: Array<{ value: PolicyDeviceType; label: string }> =
  [
    { value: "fan", label: "Fan" },
    { value: "light", label: "Light" },
    { value: "ac", label: "AC" },
    { value: "plug", label: "Plug" },
    { value: "heater", label: "Heater" },
  ];

function toErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Unable to reach DeviceWeave API. Check your connection.";
}

function actionBadgeClass(type: ActionType): string {
  if (type === "block") return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
  if (type === "allow") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300";
  return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300";
}

// ─── New Policy Drawer ────────────────────────────────────────────────────────

function NewPolicyDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (p: Policy) => void;
}) {
  const [rule, setRule] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hintsOpen, setHintsOpen] = useState(false);
  const [preview, setPreview] = useState<Policy | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setRule("");
      setError("");
      setPreview(null);
      setBusy(false);
      window.setTimeout(() => textareaRef.current?.focus(), 50);
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!rule.trim()) return;
    setBusy(true);
    setError("");
    setPreview(null);
    try {
      const policy = await authorPolicy({ rule: rule.trim() });
      setPreview(policy);
      onCreated(policy);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setError(err.message);
      } else if (err instanceof ApiError && err.status === 502) {
        setError(
          "AI compiler is temporarily unavailable. Try again in a moment.",
        );
      } else {
        setError(toErrorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => !busy && onClose()}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New policy"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-slate-900 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold">New Policy</h2>
          <button
            type="button"
            className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div>
              <label
                htmlFor="policy-rule"
                className="mb-1 block text-sm font-medium"
              >
                Describe your rule in plain English
              </label>
              <textarea
                id="policy-rule"
                ref={textareaRef}
                rows={5}
                className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
                placeholder='e.g. Block the fan when nobody is home and it&apos;s cold outside'
                value={rule}
                onChange={(e) => setRule(e.target.value)}
                disabled={busy}
                required
              />
            </div>

            {/* Hints */}
            <div className="rounded border">
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium"
                onClick={() => setHintsOpen((v) => !v)}
              >
                <span>Hints &amp; supported syntax</span>
                <span className="text-slate-400">{hintsOpen ? "▲" : "▼"}</span>
              </button>
              {hintsOpen && (
                <div className="border-t px-3 pb-3 pt-2 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p>
                    <strong>Devices:</strong> fan, light, ac, plug, heater
                  </p>
                  <p>
                    <strong>Conditions:</strong> temperature (°F), humidity (%),
                    time of day (hour 0–23), is_home
                  </p>
                  <p>
                    <strong>Actions:</strong> block, allow, modify
                  </p>
                  <p className="mt-2 italic">
                    Examples: &ldquo;Block lights after 10pm&rdquo; · &ldquo;Allow AC when temp
                    above 80°F&rdquo; · &ldquo;Block fan when nobody home&rdquo;
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {busy && (
              <div className="flex items-center gap-2 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Compiling with AI… This may take 5–15 seconds.
              </div>
            )}

            {preview && !busy && (
              <div className="rounded border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950 space-y-2">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  Policy compiled successfully!
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${actionBadgeClass(preview.action.type)}`}
                  >
                    {preview.action.type.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {preview.scope.device_type}
                  </span>
                </div>
                <PolicyConditionChips conditions={preview.conditions} />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Confidence:</span>
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className={`h-full rounded-full ${preview.confidence >= 0.95 ? "bg-emerald-500" : "bg-amber-500"}`}
                      style={{
                        width: `${Math.round(preview.confidence * 100)}%`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${preview.confidence < 0.95 ? "text-amber-600" : "text-emerald-600"}`}
                  >
                    {Math.round(preview.confidence * 100)}%
                    {preview.confidence < 0.95 && " — low confidence, review carefully"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t px-4 py-3">
            <button
              type="button"
              className="rounded border px-4 py-2 text-sm disabled:opacity-50"
              onClick={onClose}
              disabled={busy}
            >
              {preview ? "Close" : "Cancel"}
            </button>
            {!preview && (
              <button
                type="submit"
                className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
                disabled={busy || !rule.trim()}
                aria-busy={busy}
              >
                {busy ? "Compiling…" : "Compile & Save"}
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}

// ─── PoliciesTab ──────────────────────────────────────────────────────────────

export function PoliciesTab() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [deviceTypeFilter, setDeviceTypeFilter] = useState<
    PolicyDeviceType | ""
  >("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Policy | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["policies", deviceTypeFilter],
    queryFn: () =>
      getPolicies(
        deviceTypeFilter ? { device_type: deviceTypeFilter } : undefined,
      ),
  });

  const policies = data?.policies ?? [];

  const handleCreated = (_policy: Policy) => {
    void queryClient.invalidateQueries({ queryKey: ["policies"] });
    window.setTimeout(() => setDrawerOpen(false), 2000);
  };

  const handleDelete = async (policyId: string) => {
    setDeleteBusy(true);
    try {
      await deletePolicy(policyId);
      toast.success("Policy deactivated");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["policies"] });
    } catch (err) {
      toast.error(toErrorMessage(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {isError && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {toErrorMessage(error)}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="rounded border px-3 py-2 text-sm dark:bg-slate-900"
          value={deviceTypeFilter}
          onChange={(e) =>
            setDeviceTypeFilter(e.target.value as PolicyDeviceType | "")
          }
        >
          <option value="">All device types</option>
          {POLICY_DEVICE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="ml-auto rounded bg-slate-900 px-3 py-2 text-sm text-white"
          onClick={() => setDrawerOpen(true)}
        >
          New Policy
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {["sk1", "sk2", "sk3", "sk4"].map((k) => (
            <div
              key={k}
              className="h-16 animate-pulse rounded border bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : policies.length === 0 ? (
        <p className="text-sm text-slate-500">No policies found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="p-2 text-left">Rule</th>
                <th className="p-2 text-left">Device Type</th>
                <th className="p-2 text-left">Action</th>
                <th className="p-2 text-left">Conditions</th>
                <th className="p-2 text-left">Confidence</th>
                <th className="p-2 text-left">Ver.</th>
                <th className="p-2 text-left">Created</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {policies.map((p) => (
                <tr key={p.rule_id} className="border-t align-top">
                  <td className="max-w-xs p-2 text-xs text-slate-600 dark:text-slate-300">
                    {p.source_text}
                  </td>
                  <td className="p-2">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-700">
                      {p.scope.device_type}
                    </span>
                  </td>
                  <td className="p-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${actionBadgeClass(p.action.type)}`}
                    >
                      {p.action.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-2">
                    <PolicyConditionChips conditions={p.conditions} />
                  </td>
                  <td className="p-2">
                    <span className="text-xs">
                      {Math.round(p.confidence * 100)}%
                    </span>
                  </td>
                  <td className="p-2 text-xs text-slate-500">v{p.version}</td>
                  <td className="p-2 text-xs text-slate-500">
                    {format(new Date(p.created_at), "MMM d, yyyy")}
                  </td>
                  <td className="p-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        p.status === "active"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-2">
                    <button
                      type="button"
                      className="text-xs text-red-600 underline"
                      onClick={() => setDeleteTarget(p)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewPolicyDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={handleCreated}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Deactivate policy?"
        confirmText="Deactivate"
        busy={deleteBusy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) void handleDelete(deleteTarget.rule_id);
        }}
      >
        Deactivate this policy? It will stop enforcing immediately.
      </ConfirmDialog>
    </div>
  );
}
