'use client';

import { useEffect, useRef, useState } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { AgentRow } from '@/components/admin/agent-management/shared/agentPrompts';

/**
 * Edit one agent's system prompt, next to the envelope it sits inside.
 *
 * `goal_template` is a single block within a much larger prompt: the
 * orchestrator wraps it in ROLE, TEAM_NORTH_STAR, an output contract and the
 * team's hard constraints before the model sees it. Editing it without that
 * context is the commonest way a prompt change does not do what its author
 * expected — someone re-states a rule the contract already enforces, or
 * writes markdown the contract forbids.
 */
export function PromptEditorDrawer({
  open,
  row,
  preview,
  warnings,
  onClose,
  onSave,
}: {
  open: boolean;
  row: AgentRow | null;
  preview: string;
  warnings: string[];
  onClose: () => void;
  onSave: (row: AgentRow, prompt: string) => Promise<void>;
}) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useFocusTrap(drawerRef, open);

  useEffect(() => {
    if (!open || !row) return;
    setDraft(row.prompt);
    setSaveError('');
  }, [open, row]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !row) return null;

  const dirty = draft !== row.prompt;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-editor-title"
    >
      <div
        ref={drawerRef}
        className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl dark:bg-slate-900"
      >
        <div className="flex items-start justify-between border-b p-4">
          <div className="min-w-0">
            <h3 id="prompt-editor-title" className="text-lg font-semibold">
              {row.displayName}
            </h3>
            <p className="truncate font-mono text-xs text-slate-500">{row.agentId}</p>
            <p className="mt-1 text-xs text-slate-500">
              {row.teamName}
              {row.orphaned ? ' · not in any workflow step' : ` · step ${row.stepNumber}`}
              {row.schemaRef ? ` · validated against ${row.schemaRef}` : ''}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close prompt editor"
            className="focus-ring shrink-0 rounded border px-3 py-1 text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {warnings.length > 0 && (
            <ul className="space-y-1 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}

          <div>
            <label htmlFor="agent-prompt" className="block text-sm font-medium">
              System prompt
            </label>
            <p id="agent-prompt-hint" className="mt-1 text-xs text-slate-500">
              What this agent is for, in its own words. The orchestrator supplies the role, the
              output contract and the team constraints around it — you do not need to repeat them.
            </p>
            <textarea
              id="agent-prompt"
              aria-describedby="agent-prompt-hint"
              className="focus-ring mt-2 min-h-[220px] w-full resize-y rounded border px-3 py-2 font-mono text-sm"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </div>

          <details open>
            <summary className="cursor-pointer text-sm font-medium">
              What the model actually receives
            </summary>
            <p className="mt-1 text-xs text-slate-500">
              The prompt above, inside the envelope the orchestrator builds. Sections marked
              “filled at run time” carry the request, research and retrieved context for that run.
            </p>
            <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded border bg-slate-50 p-3 text-xs dark:bg-slate-800">
              {preview.replace(row.prompt, draft)}
            </pre>
          </details>

          {saveError && (
            <p role="alert" className="text-sm text-red-600">
              {saveError}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-white p-3 dark:bg-slate-900">
          <span className="text-xs text-slate-500">
            {dirty ? 'Unsaved changes' : 'No changes'}
          </span>
          <div className="flex gap-2">
            <button type="button" className="focus-ring rounded border px-4 py-2 text-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!dirty || saving}
              onClick={() => {
                void (async () => {
                  setSaving(true);
                  setSaveError('');
                  try {
                    await onSave(row, draft);
                  } catch (err) {
                    setSaveError(err instanceof Error ? err.message : 'Could not save the prompt');
                  } finally {
                    setSaving(false);
                  }
                })();
              }}
            >
              {saving ? 'Saving…' : 'Save prompt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
