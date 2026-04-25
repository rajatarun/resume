"use client";

import { Fragment, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  executeCommand,
  ApiError,
  ExecuteResult,
  DeviceResult,
  SceneResult,
  MultiDeviceResult,
  PolicyBlock,
} from "@/lib/deviceweave";

// ─── Local types ──────────────────────────────────────────────────────────────

type HistoryEntry = {
  command: string;
  status: "success" | "blocked" | "unresolved";
  time: Date;
};

type ErrorState =
  | { kind: "policy"; message: string; rule_id?: string }
  | {
      kind: "unresolved";
      message: string;
      best_match_name?: string;
      final_score?: number;
      hint?: string;
    }
  | { kind: "infra" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── Result cards ─────────────────────────────────────────────────────────────

function DeviceResultCard({ result }: { result: DeviceResult }) {
  const [reasonOpen, setReasonOpen] = useState(false);
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950 space-y-3">
      <div className="flex flex-wrap items-start gap-2">
        <span className="mt-0.5 text-lg font-bold text-emerald-600 dark:text-emerald-400">
          ✓
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{result.device_name}</span>
            <span className="text-slate-400">·</span>
            <span className="font-mono text-sm text-slate-600 dark:text-slate-300">
              {result.action}
            </span>
            <span
              className={`ml-auto rounded px-2 py-0.5 text-xs font-medium ${
                result.resolution_tier === "cosine"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
              }`}
            >
              {result.resolution_tier === "cosine" ? "cosine" : "AI"}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Resolved via {result.resolution_tier === "cosine" ? "cosine" : "AI"} ·{" "}
            {Math.round(result.confidence * 100)}% confidence
          </p>
        </div>
      </div>

      {Object.keys(result.result).length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {Object.entries(result.result)
            .filter(([, v]) => v !== null && v !== undefined)
            .map(([k, v]) => (
              <Fragment key={k}>
                <dt className="capitalize text-slate-500">{k.replace(/_/g, " ")}:</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200">{String(v)}</dd>
              </Fragment>
            ))}
        </dl>
      )}

      {result.policy?.verdict === "modify" && (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          ⚠ Policy applied: {result.policy.reason}
        </div>
      )}

      {result.reasoning && (
        <div>
          <button
            type="button"
            className="text-xs text-slate-500 underline hover:text-slate-700"
            onClick={() => setReasonOpen((v) => !v)}
          >
            {reasonOpen ? "Hide" : "Show"} AI reasoning
          </button>
          {reasonOpen && (
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {result.reasoning}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PolicyBlocksSection({ blocks }: { blocks: PolicyBlock[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950">
      <button
        type="button"
        className="flex w-full items-center justify-between text-sm font-medium text-amber-800 dark:text-amber-300"
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          ⚠ {blocks.length} device{blocks.length !== 1 ? "s" : ""} blocked by policy
        </span>
        <span className="text-xs text-slate-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <ul className="mt-2 space-y-1">
          {blocks.map((b, i) => (
            <li key={i} className="text-xs text-amber-700 dark:text-amber-400">
              <span className="font-medium">{b.device_name}</span>: {b.reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SceneResultCard({
  result,
  label,
}: {
  result: SceneResult | MultiDeviceResult;
  label: string;
}) {
  const [reasonOpen, setReasonOpen] = useState(false);
  const total = result.results.length + (result.policy_blocks?.length ?? 0);

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950 space-y-3">
      <div className="flex flex-wrap items-start gap-2">
        <span className="mt-0.5 text-lg font-bold text-emerald-600 dark:text-emerald-400">
          ✓
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">
              {"scene_name" in result ? result.scene_name : "Multi-device"}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {result.succeeded} of {total} devices
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {label} · {Math.round(result.confidence * 100)}% confidence
          </p>
        </div>
      </div>

      <div className="space-y-1">
        {result.results.map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 text-sm ${
              item.success
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            <span className="font-medium">{item.success ? "✓" : "✗"}</span>
            <span>{item.device_name}</span>
            <span className="text-slate-400">→</span>
            <span className="font-mono text-xs">{item.action}</span>
            {item.error && (
              <span className="text-xs text-red-400">({item.error})</span>
            )}
          </div>
        ))}
      </div>

      {result.policy_blocks && result.policy_blocks.length > 0 && (
        <PolicyBlocksSection blocks={result.policy_blocks} />
      )}

      {"reasoning" in result && result.reasoning && (
        <div>
          <button
            type="button"
            className="text-xs text-slate-500 underline hover:text-slate-700"
            onClick={() => setReasonOpen((v) => !v)}
          >
            {reasonOpen ? "Hide" : "Show"} AI reasoning
          </button>
          {reasonOpen && (
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {result.reasoning}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ErrorCard({
  error,
  onGoToPolicies,
}: {
  error: ErrorState;
  onGoToPolicies: () => void;
}) {
  if (error.kind === "infra") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
        <p className="font-medium text-red-700 dark:text-red-400">
          DeviceWeave is temporarily unavailable. Try again.
        </p>
      </div>
    );
  }

  if (error.kind === "policy") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-red-600 dark:text-red-400">⊘</span>
          <span className="font-semibold text-red-700 dark:text-red-400">
            Blocked by policy
          </span>
        </div>
        <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
        {error.rule_id && (
          <button
            type="button"
            className="text-sm text-red-700 underline hover:text-red-900 dark:text-red-400"
            onClick={() => onGoToPolicies()}
          >
            Rule ID: {error.rule_id}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950 space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-bold text-amber-600 dark:text-amber-400">?</span>
        <span className="font-semibold text-amber-700 dark:text-amber-400">
          Could not resolve command
        </span>
      </div>
      <p className="text-sm text-amber-600 dark:text-amber-400">{error.message}</p>
      {error.best_match_name !== undefined && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Closest match: {error.best_match_name}
          {error.final_score !== undefined &&
            ` (${Math.round(error.final_score * 100)}%)`}
        </p>
      )}
      <p className="text-xs text-amber-500">
        {error.hint ?? "Tip: Use the Learnings tab to add a phrase for this device."}
      </p>
    </div>
  );
}

// ─── Suggestion chips ─────────────────────────────────────────────────────────

const SUGGESTION_CHIPS = [
  "Turn on office light",
  "Start work mode",
  "Turn off the fan",
  "Dim office light to 30%",
];

// ─── HomeTab ──────────────────────────────────────────────────────────────────

export function HomeTab() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const pushHistory = (cmd: string, status: HistoryEntry["status"]) => {
    setHistory((prev) => [
      { command: cmd, status, time: new Date() },
      ...prev.slice(0, 9),
    ]);
  };

  const handleSubmit = async () => {
    const cmd = command.trim();
    if (!cmd || loading) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await executeCommand(cmd);
      setResult(res);
      pushHistory(cmd, "success");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          const rule_id =
            typeof err.extra?.rule_id === "string" ? err.extra.rule_id : undefined;
          setError({ kind: "policy", message: err.message, rule_id });
          pushHistory(cmd, "blocked");
        } else if (err.status === 422) {
          const extra = err.extra ?? {};
          const best_match_id =
            typeof extra.best_match_id === "string" ? extra.best_match_id : undefined;
          setError({
            kind: "unresolved",
            message: err.message,
            best_match_name: best_match_id,
            final_score:
              typeof extra.final_score === "number" ? extra.final_score : undefined,
            hint: typeof extra.hint === "string" ? extra.hint : undefined,
          });
          pushHistory(cmd, "unresolved");
        } else {
          setError({ kind: "infra" });
          pushHistory(cmd, "unresolved");
        }
      } else {
        setError({ kind: "infra" });
        pushHistory(cmd, "unresolved");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToPolicies = () => {
    router.push("/admin/home-automation?tab=policies");
  };

  return (
    <div className="space-y-6">
      {/* ── Command input ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-10 text-base shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:focus:border-slate-400 dark:focus:ring-slate-700"
              placeholder="e.g. Turn off all the lights, Start work mode, Dim the office light to 40%"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
              disabled={loading}
            />
            {command && !loading && (
              <button
                type="button"
                aria-label="Clear"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xl leading-none text-slate-400 hover:text-slate-600"
                onClick={() => {
                  setCommand("");
                  inputRef.current?.focus();
                }}
              >
                ×
              </button>
            )}
          </div>
          <button
            type="button"
            className="flex shrink-0 items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
            onClick={() => void handleSubmit()}
            disabled={loading || !command.trim()}
          >
            {loading && <Spinner />}
            Run
          </button>
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-2">
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              onClick={() => setCommand(chip)}
              disabled={loading}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* ── Result area ── */}
      {!result && !error && !loading && (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-400 dark:text-slate-600">
          <svg
            className="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
            />
          </svg>
          <p className="text-sm">Send a command to get started</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-slate-500">
            <Spinner />
            <span className="text-sm">Resolving command…</span>
          </div>
        </div>
      )}

      {!loading && result && (
        result.type === "device" ? (
          <DeviceResultCard result={result} />
        ) : (
          <SceneResultCard
            result={result}
            label={result.type === "scene" ? "Scene" : "Multi-device · AI resolved"}
          />
        )
      )}

      {!loading && error && (
        <ErrorCard error={error} onGoToPolicies={handleGoToPolicies} />
      )}

      {/* ── History ── */}
      {history.length > 0 && (
        <div className="space-y-2 border-t pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Recent
          </p>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {history.map((entry, i) => (
              <button
                key={i}
                type="button"
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
                onClick={() => setCommand(entry.command)}
              >
                <span className="flex-1 truncate text-slate-700 dark:text-slate-300">
                  {entry.command}
                </span>
                <span className="shrink-0 text-slate-300 dark:text-slate-600">·</span>
                <span
                  className={`shrink-0 text-xs ${
                    entry.status === "success"
                      ? "text-emerald-600 dark:text-emerald-500"
                      : entry.status === "blocked"
                        ? "text-red-500"
                        : "text-amber-500"
                  }`}
                >
                  {entry.status === "success"
                    ? "✓ success"
                    : entry.status === "blocked"
                      ? "⊘ blocked"
                      : "? unresolved"}
                </span>
                <span className="shrink-0 text-slate-300 dark:text-slate-600">·</span>
                <span className="shrink-0 text-xs text-slate-400">
                  {timeAgo(entry.time)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
