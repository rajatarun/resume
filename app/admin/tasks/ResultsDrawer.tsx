"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResultMeta, TaskExecutionResult } from "@/types/routineweave";
import { listResults, getResult } from "@/lib/routineweave-api";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatDuration(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function filenameFromKey(key: string): string {
  return key.split("/").pop() ?? key;
}

function syntaxHighlightJson(value: unknown): string {
  const raw = JSON.stringify(value, null, 2);
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(
    /("(?:\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      if (match.startsWith('"')) {
        return match.endsWith(":")
          ? `<span style="color:#818cf8">${match}</span>`
          : `<span style="color:#34d399">${match}</span>`;
      }
      if (match === "true" || match === "false") return `<span style="color:#fbbf24">${match}</span>`;
      if (match === "null") return `<span style="color:#94a3b8">${match}</span>`;
      return `<span style="color:#60a5fa">${match}</span>`;
    }
  );
}

function ResultSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded border px-4 py-3 dark:border-slate-700">
          <div className="h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="ml-auto h-3 w-12 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      ))}
    </div>
  );
}

interface DetailPanelProps {
  meta: ResultMeta;
}

function DetailPanel({ meta }: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState<"structured" | "raw">("structured");
  const filename = filenameFromKey(meta.key);

  const { data: detail, isLoading } = useQuery<TaskExecutionResult>({
    queryKey: ["routineweave", "result", meta.task_name, meta.date, filename],
    queryFn: () => getResult(meta.task_name, meta.date, filename),
  });

  if (isLoading) {
    return (
      <div className="space-y-2 bg-slate-50 px-4 py-3 dark:bg-slate-800/40">
        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  if (!detail) return null;

  const hasStructured = Boolean(detail.structured_result);
  const hasRaw = Boolean(detail.result);
  const tabs = (["structured", "raw"] as const).filter((t) => (t === "structured" ? hasStructured : hasRaw));
  const shownTab = tabs.includes(activeTab) ? activeTab : (tabs[0] ?? "structured");

  return (
    <div className="border-t bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40">
      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2 text-xs">
        <span>
          <span className="text-slate-400">Status </span>
          <span className={`font-medium ${detail.success ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {detail.success ? "Success" : "Failed"}
          </span>
        </span>
        <span>
          <span className="text-slate-400">Duration </span>
          <span className="font-medium text-slate-700 dark:text-slate-300">{formatDuration(detail.duration_ms)}</span>
        </span>
        <span>
          <span className="text-slate-400">Time </span>
          <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(detail.timestamp).toLocaleString()}</span>
        </span>
        {detail.error && (
          <span className="text-red-500">Error: {detail.error}</span>
        )}
      </div>

      {/* Tabs */}
      {tabs.length > 0 && (
        <div className="px-4 pb-3">
          <div className="mb-2 flex gap-1 border-b dark:border-slate-700">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`-mb-px border-b-2 px-3 py-1.5 text-xs ${
                  shownTab === tab
                    ? "border-slate-800 font-medium dark:border-slate-200"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {tab === "structured" ? "Structured Result" : "Raw Text"}
              </button>
            ))}
          </div>

          {shownTab === "structured" && detail.structured_result && (
            <pre
              className="max-h-72 overflow-auto rounded bg-slate-900 p-3 text-xs leading-relaxed"
              dangerouslySetInnerHTML={{ __html: syntaxHighlightJson(detail.structured_result) }}
            />
          )}

          {shownTab === "raw" && detail.result && (
            <pre className="max-h-72 overflow-auto rounded bg-slate-900 p-3 text-xs leading-relaxed text-slate-100 whitespace-pre-wrap break-words">
              {detail.result}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

interface ResultRowProps {
  meta: ResultMeta;
}

function ResultRow({ meta }: ResultRowProps) {
  const [expanded, setExpanded] = useState(false);
  const localTime = new Date(meta.timestamp).toLocaleTimeString();

  return (
    <div className="border-b last:border-b-0 dark:border-slate-700">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
      >
        <span
          className={`text-[10px] text-slate-400 transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
          aria-hidden="true"
        >
          ▶
        </span>
        <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{meta.date}</span>
        <span className="text-xs text-slate-500">{localTime}</span>
        <span className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          {formatSize(meta.size_bytes)}
        </span>
      </button>
      {expanded && <DetailPanel meta={meta} />}
    </div>
  );
}

interface ResultsDrawerProps {
  taskName: string | null;
  onClose: () => void;
}

export function ResultsDrawer({ taskName, onClose }: ResultsDrawerProps) {
  const open = taskName !== null;
  const panelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["routineweave", "results", taskName],
    queryFn: () => listResults(taskName!),
    enabled: Boolean(taskName),
  });

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const results = data?.results ?? [];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={taskName ? `${taskName} — Saved Results` : "Saved Results"}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-slate-900 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold">
            <span className="font-mono">{taskName}</span>
            <span className="ml-2 font-normal text-slate-500">— Saved Results</span>
          </h2>
          <button
            type="button"
            className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <ResultSkeleton />
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-3 text-4xl">🕐</div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No results saved yet.</p>
              <p className="mt-1 max-w-xs text-xs text-slate-400">
                Results will appear here after the task runs with Save Result enabled.
              </p>
            </div>
          ) : (
            <div>
              {results.map((meta) => (
                <ResultRow key={meta.key} meta={meta} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
