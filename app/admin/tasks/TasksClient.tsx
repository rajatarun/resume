"use client";

import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TaskDefinition, ApiFieldError } from "@/types/routineweave";
import { listTasks, createTask, updateTask, deleteTask, RoutineWeaveApiError } from "@/lib/routineweave-api";
import { useToast } from "@/components/admin/ToastProvider";
import { TaskTable, TaskTableSkeleton } from "./TaskTable";
import { TaskFormDrawer } from "./TaskFormDrawer";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { ResultsDrawer } from "./ResultsDrawer";

const TASKS_KEY = ["routineweave", "tasks"] as const;

export default function TasksClient() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: tasks, isLoading, isError, error } = useQuery({
    queryKey: TASKS_KEY,
    queryFn: listTasks,
  });

  // Create / edit drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDefinition | null>(null);
  const [formFieldErrors, setFormFieldErrors] = useState<ApiFieldError[]>([]);

  // Delete dialog
  const [deletingTaskName, setDeletingTaskName] = useState<string | null>(null);
  const [deletesBusy, setDeleteBusy] = useState(false);

  // Optimistic enabled toggle
  const [pendingToggles, setPendingToggles] = useState<Record<string, boolean>>({});
  const [togglingTask, setTogglingTask] = useState<string | null>(null);

  // Optimistic save_result toggle
  const [pendingSaveResultToggles, setPendingSaveResultToggles] = useState<Record<string, boolean>>({});
  const [togglingSaveResultTask, setTogglingSaveResultTask] = useState<string | null>(null);

  // Results drawer
  const [resultsTaskName, setResultsTaskName] = useState<string | null>(null);

  // Error banner
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const openCreate = () => {
    setEditingTask(null);
    setFormFieldErrors([]);
    setDrawerOpen(true);
  };

  const openEdit = (task: TaskDefinition) => {
    setEditingTask(task);
    setFormFieldErrors([]);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingTask(null);
    setFormFieldErrors([]);
  };

  const handleFormSubmit = useCallback(async (data: TaskDefinition) => {
    setFormFieldErrors([]);
    try {
      if (editingTask) {
        await updateTask(data.task_name, data);
        toast.success(`Task "${data.task_name}" updated.`);
      } else {
        await createTask(data);
        toast.success(`Task "${data.task_name}" created.`);
      }
      closeDrawer();
      void queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    } catch (err) {
      if (err instanceof RoutineWeaveApiError && err.details?.length) {
        setFormFieldErrors(err.details);
      }
      toast.error(err instanceof Error ? err.message : "Save failed");
      throw err;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTask, queryClient, toast]);

  const handleDelete = useCallback(async () => {
    if (!deletingTaskName) return;
    setDeleteBusy(true);
    try {
      await deleteTask(deletingTaskName);
      toast.success(`Task "${deletingTaskName}" deleted.`);
      setDeletingTaskName(null);
      void queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleteBusy(false);
    }
  }, [deletingTaskName, queryClient, toast]);

  const handleToggleEnabled = useCallback(async (task: TaskDefinition) => {
    const newEnabled = !task.enabled;
    setTogglingTask(task.task_name);
    setPendingToggles((prev) => ({ ...prev, [task.task_name]: newEnabled }));
    try {
      await updateTask(task.task_name, { ...task, enabled: newEnabled });
      toast.success(`Task "${task.task_name}" ${newEnabled ? "enabled" : "disabled"}.`);
      void queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    } catch (err) {
      setPendingToggles((prev) => {
        const next = { ...prev };
        delete next[task.task_name];
        return next;
      });
      toast.error(err instanceof Error ? err.message : "Toggle failed");
    } finally {
      setTogglingTask(null);
    }
  }, [queryClient, toast]);

  const handleToggleSaveResult = useCallback(async (task: TaskDefinition) => {
    const newSaveResult = !(task.save_result ?? false);
    setTogglingSaveResultTask(task.task_name);
    setPendingSaveResultToggles((prev) => ({ ...prev, [task.task_name]: newSaveResult }));
    try {
      await updateTask(task.task_name, { ...task, save_result: newSaveResult });
      toast.success(`Save result ${newSaveResult ? "enabled" : "disabled"} for "${task.task_name}".`);
      void queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    } catch (err) {
      setPendingSaveResultToggles((prev) => {
        const next = { ...prev };
        delete next[task.task_name];
        return next;
      });
      toast.error(err instanceof Error ? err.message : "Toggle failed");
    } finally {
      setTogglingSaveResultTask(null);
    }
  }, [queryClient, toast]);

  const showError = isError && !bannerDismissed;
  const errorMessage = error instanceof Error ? error.message : "Failed to load tasks";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">RoutineWeave Tasks</h2>
        <button
          type="button"
          onClick={openCreate}
          className="rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
        >
          + New Task
        </button>
      </div>

      {/* Error banner */}
      {showError && (
        <div
          role="alert"
          className="flex items-center justify-between rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            className="ml-4 text-red-500 hover:text-red-700"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Table / skeleton / empty */}
      {isLoading ? (
        <TaskTableSkeleton />
      ) : (
        <TaskTable
          tasks={tasks ?? []}
          pendingToggles={pendingToggles}
          togglingTask={togglingTask}
          pendingSaveResultToggles={pendingSaveResultToggles}
          togglingSaveResultTask={togglingSaveResultTask}
          onEdit={openEdit}
          onDelete={setDeletingTaskName}
          onToggleEnabled={handleToggleEnabled}
          onToggleSaveResult={handleToggleSaveResult}
          onViewResults={setResultsTaskName}
          onNew={openCreate}
        />
      )}

      {/* Create / Edit drawer */}
      <TaskFormDrawer
        open={drawerOpen}
        task={editingTask}
        onClose={closeDrawer}
        onSubmit={handleFormSubmit}
        fieldErrors={formFieldErrors}
      />

      {/* Delete confirmation */}
      <DeleteTaskDialog
        taskName={deletingTaskName}
        busy={deletesBusy}
        onCancel={() => setDeletingTaskName(null)}
        onConfirm={handleDelete}
      />

      {/* Results drawer */}
      <ResultsDrawer
        taskName={resultsTaskName}
        onClose={() => setResultsTaskName(null)}
      />
    </div>
  );
}
