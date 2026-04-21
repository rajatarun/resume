"use client";

import { TaskDefinition } from "@/types/routineweave";

interface TaskTableProps {
  tasks: TaskDefinition[];
  pendingToggles: Record<string, boolean>;
  togglingTask: string | null;
  onEdit: (task: TaskDefinition) => void;
  onDelete: (taskName: string) => void;
  onToggleEnabled: (task: TaskDefinition) => void;
  onNew: () => void;
}

export function TaskTable({ tasks, pendingToggles, togglingTask, onEdit, onDelete, onToggleEnabled, onNew }: TaskTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
        <div className="mb-3 text-4xl">📋</div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No tasks yet</p>
        <p className="mb-4 text-xs text-slate-400">Create your first RoutineWeave task to get started.</p>
        <button
          type="button"
          onClick={onNew}
          className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
        >
          Create your first task
        </button>
      </div>
    );
  }

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
            <th className="px-3 py-2">Output</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const effectiveEnabled = task.task_name in pendingToggles ? pendingToggles[task.task_name] : task.enabled;
            const isToggling = togglingTask === task.task_name;

            return (
              <tr key={task.task_name} className="border-t dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-3 py-2 font-mono font-medium">{task.task_name}</td>
                <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-400">{task.schedule}</td>
                <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 max-w-[160px] truncate">{task.model}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      effectiveEnabled
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                    }`}
                  >
                    {effectiveEnabled ? "Enabled" : "Disabled"}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">{task.grounding ? "✓" : "—"}</td>
                <td className="px-3 py-2">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
                    {task.output.type}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(task)}
                      className="text-xs underline text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleEnabled(task)}
                      disabled={isToggling}
                      className="text-xs underline text-slate-600 hover:text-slate-900 disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                      {isToggling ? "…" : effectiveEnabled ? "Disable" : "Enable"}
                    </button>
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
            );
          })}
        </tbody>
      </table>
    </div>
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
            <th className="px-3 py-2">Output</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 4 }).map((_, i) => (
            <tr key={i} className="border-t dark:border-slate-700">
              {Array.from({ length: 7 }).map((__, j) => (
                <td key={j} className="px-3 py-2">
                  <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" style={{ width: j === 0 ? "8rem" : j === 1 ? "5rem" : "4rem" }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
