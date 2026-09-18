"use client";

import { Fragment, type ReactNode } from "react";
import { TaskDefinition } from "@/types/routineweave";

function InlineSwitch({
  checked,
  onChange,
  busy,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  busy?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={busy}
      onClick={onChange}
      className={`relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
      }`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition duration-150 ${
          checked ? "translate-x-3" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
      <path fillRule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7-4.75a.75.75 0 0 1 .75.75v3.69l2.22 2.22a.75.75 0 1 1-1.06 1.06l-2.5-2.5A.75.75 0 0 1 7.25 8V4a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
    </svg>
  );
}

function EnabledPill({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        enabled
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
          : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
      }`}
    >
      {enabled ? "Enabled" : "Disabled"}
    </span>
  );
}

interface TaskTableProps {
  tasks: TaskDefinition[];
  pendingToggles: Record<string, boolean>;
  togglingTask: string | null;
  pendingSaveResultToggles: Record<string, boolean>;
  togglingSaveResultTask: string | null;
  onEdit: (task: TaskDefinition) => void;
  onDelete: (taskName: string) => void;
  onToggleEnabled: (task: TaskDefinition) => void;
  onToggleSaveResult: (task: TaskDefinition) => void;
  onViewResults: (taskName: string) => void;
  onNew: () => void;
  /**
   * The gate, for the one task currently staged. Rendered under that task's
   * row (and inside its card on a phone) rather than on a separate screen.
   */
  renderGate?: (task: TaskDefinition) => ReactNode;
}

export function TaskTable({
  tasks,
  pendingToggles,
  togglingTask,
  pendingSaveResultToggles,
  togglingSaveResultTask,
  onEdit,
  onDelete,
  onToggleEnabled,
  onToggleSaveResult,
  onViewResults,
  onNew,
  renderGate,
}: TaskTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No tasks yet</p>
        <p className="mb-4 text-xs text-slate-400">Create your first RoutineWeave task to get started.</p>
        <button
          type="button"
          onClick={onNew}
          className="min-h-[44px] rounded bg-slate-900 px-4 text-sm text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
        >
          Create your first task
        </button>
      </div>
    );
  }

  const rows = tasks.map((task) => {
    const effectiveEnabled = task.task_name in pendingToggles ? pendingToggles[task.task_name] : task.enabled;
    const isTogglingEnabled = togglingTask === task.task_name;
    const effectiveSaveResult =
      task.task_name in pendingSaveResultToggles
        ? pendingSaveResultToggles[task.task_name]
        : (task.save_result ?? false);
    const isTogglingSaveResult = togglingSaveResultTask === task.task_name;
    return { task, effectiveEnabled, isTogglingEnabled, effectiveSaveResult, isTogglingSaveResult };
  });

  const actionClass =
    "min-h-[44px] text-xs underline text-slate-600 hover:text-slate-900 disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-100";

  return (
    <>
      {/* Phone: one card per task. The table below keeps the task name in its
          first column, which is exactly the column a 390px viewport scrolls
          off the left edge — leaving rows you cannot identify. */}
      <ul className="space-y-3 md:hidden">
        {rows.map(({ task, effectiveEnabled, isTogglingEnabled, effectiveSaveResult, isTogglingSaveResult }) => (
          <li key={task.task_name} className="overflow-hidden rounded-xl border bg-white dark:border-slate-700 dark:bg-slate-900">
            <div className="p-3.5">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 truncate font-mono text-sm font-medium">{task.task_name}</span>
                <EnabledPill enabled={effectiveEnabled} />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {task.schedule}
                </span>
                <span className="max-w-[45%] truncate rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {task.model}
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {task.output.type}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                <span>Grounding {task.grounding ? "✓" : "—"}</span>
                <span className="flex items-center gap-2">
                  Save
                  <InlineSwitch
                    checked={effectiveSaveResult}
                    onChange={() => onToggleSaveResult(task)}
                    busy={isTogglingSaveResult}
                    label={`${effectiveSaveResult ? "Disable" : "Enable"} save result for ${task.task_name}`}
                  />
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-4">
                <button type="button" onClick={() => onEdit(task)} className={actionClass}>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onToggleEnabled(task)}
                  disabled={isTogglingEnabled}
                  className={actionClass}
                >
                  {isTogglingEnabled ? "…" : effectiveEnabled ? "Disable" : "Enable"}
                </button>
                {effectiveSaveResult && (
                  <button
                    type="button"
                    onClick={() => onViewResults(task.task_name)}
                    className={`inline-flex items-center gap-1 ${actionClass}`}
                  >
                    <ClockIcon />
                    Results
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(task.task_name)}
                  className="min-h-[44px] text-xs underline text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
            {renderGate?.(task)}
          </li>
        ))}
      </ul>

      <div className="hidden overflow-auto rounded border md:block dark:border-slate-700">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs dark:bg-slate-800">
            <tr>
              <th className="px-3 py-2">Task name</th>
              <th className="px-3 py-2">Schedule</th>
              <th className="px-3 py-2">Model</th>
              <th className="px-3 py-2">Enabled</th>
              <th className="px-3 py-2">Grounding</th>
              <th className="px-3 py-2">Save Result</th>
              <th className="px-3 py-2">Output</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ task, effectiveEnabled, isTogglingEnabled, effectiveSaveResult, isTogglingSaveResult }) => {
              const gate = renderGate?.(task);
              return (
                <Fragment key={task.task_name}>
                  <tr
                    className="border-t dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-3 py-2 font-mono font-medium">{task.task_name}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-400">{task.schedule}</td>
                    <td className="max-w-[160px] truncate px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
                      {task.model}
                    </td>
                    <td className="px-3 py-2">
                      <EnabledPill enabled={effectiveEnabled} />
                    </td>
                    <td className="px-3 py-2 text-center">{task.grounding ? "✓" : "—"}</td>
                    <td className="px-3 py-2">
                      <InlineSwitch
                        checked={effectiveSaveResult}
                        onChange={() => onToggleSaveResult(task)}
                        busy={isTogglingSaveResult}
                        label={`${effectiveSaveResult ? "Disable" : "Enable"} save result for ${task.task_name}`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
                        {task.output.type}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => onEdit(task)} className="text-xs underline text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleEnabled(task)}
                          disabled={isTogglingEnabled}
                          className="text-xs underline text-slate-600 hover:text-slate-900 disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-100"
                        >
                          {isTogglingEnabled ? "…" : effectiveEnabled ? "Disable" : "Enable"}
                        </button>
                        {effectiveSaveResult && (
                          <button
                            type="button"
                            onClick={() => onViewResults(task.task_name)}
                            className="inline-flex items-center gap-1 text-xs text-slate-600 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                            title="View saved results"
                          >
                            <ClockIcon />
                            Results
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDelete(task.task_name)}
                          className="text-xs underline text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  {gate && (
                    <tr className="border-t dark:border-slate-700">
                      <td colSpan={8} className="p-0">
                        {gate}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function TaskTableSkeleton() {
  return (
    <div className="overflow-auto rounded border dark:border-slate-700">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100 text-left text-xs dark:bg-slate-800">
          <tr>
            <th className="px-3 py-2">Task name</th>
            <th className="px-3 py-2">Schedule</th>
            <th className="px-3 py-2">Model</th>
            <th className="px-3 py-2">Enabled</th>
            <th className="px-3 py-2">Grounding</th>
            <th className="px-3 py-2">Save Result</th>
            <th className="px-3 py-2">Output</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 4 }).map((_, i) => (
            <tr key={i} className="border-t dark:border-slate-700">
              {Array.from({ length: 8 }).map((__, j) => (
                <td key={j} className="px-3 py-2">
                  <div
                    className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700"
                    style={{ width: j === 0 ? "8rem" : j === 1 ? "5rem" : "4rem" }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
