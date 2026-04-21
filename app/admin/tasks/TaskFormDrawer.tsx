"use client";

import { useEffect, useRef, useState } from "react";
import { TaskDefinition, ApiFieldError } from "@/types/routineweave";
import { CronPreview, PromptPreview } from "./CronPreview";

const DEFAULT_MODEL = "gemini-3.1-flash-lite-preview";
const DEFAULT_TIMEOUT = 60000;

type KVPair = { key: string; value: string };
type InputPair = { key: string; value: string; mode: "string" | "list"; tags: string[] };

function toKVPairs(obj?: Record<string, string>): KVPair[] {
  if (!obj) return [];
  return Object.entries(obj).map(([key, value]) => ({ key, value }));
}

function fromKVPairs(pairs: KVPair[]): Record<string, string> {
  return Object.fromEntries(pairs.filter((p) => p.key).map((p) => [p.key, p.value]));
}

function toInputPairs(obj?: Record<string, string | string[]>): InputPair[] {
  if (!obj) return [];
  return Object.entries(obj).map(([key, value]) => {
    if (Array.isArray(value)) {
      return { key, value: "", mode: "list" as const, tags: value };
    }
    return { key, value, mode: "string" as const, tags: [] };
  });
}

function fromInputPairs(pairs: InputPair[]): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const p of pairs) {
    if (!p.key) continue;
    out[p.key] = p.mode === "list" ? p.tags : p.value;
  }
  return out;
}

interface KVEditorProps {
  pairs: KVPair[];
  onChange: (pairs: KVPair[]) => void;
  label?: string;
  addLabel?: string;
}

function KVEditor({ pairs, onChange, addLabel = "Add row" }: KVEditorProps) {
  const add = () => onChange([...pairs, { key: "", value: "" }]);
  const remove = (i: number) => onChange(pairs.filter((_, idx) => idx !== i));
  const update = (i: number, field: "key" | "value", val: string) =>
    onChange(pairs.map((p, idx) => (idx === i ? { ...p, [field]: val } : p)));

  return (
    <div className="space-y-1">
      {pairs.map((pair, i) => (
        <div key={i} className="flex gap-1">
          <input
            className="w-2/5 rounded border px-2 py-1 text-xs dark:bg-slate-800"
            placeholder="key"
            value={pair.key}
            onChange={(e) => update(i, "key", e.target.value)}
          />
          <input
            className="flex-1 rounded border px-2 py-1 text-xs dark:bg-slate-800"
            placeholder="value"
            value={pair.value}
            onChange={(e) => update(i, "value", e.target.value)}
          />
          <button
            type="button"
            className="px-1.5 text-slate-400 hover:text-red-500"
            onClick={() => remove(i)}
            aria-label="Remove"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="mt-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        onClick={add}
      >
        + {addLabel}
      </button>
    </div>
  );
}

interface InputEditorProps {
  pairs: InputPair[];
  onChange: (pairs: InputPair[]) => void;
}

function InputEditor({ pairs, onChange }: InputEditorProps) {
  const [tagDraft, setTagDraft] = useState<Record<number, string>>({});

  const add = () => onChange([...pairs, { key: "", value: "", mode: "string", tags: [] }]);
  const remove = (i: number) => onChange(pairs.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<InputPair>) =>
    onChange(pairs.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const addTag = (i: number) => {
    const draft = (tagDraft[i] ?? "").trim();
    if (!draft) return;
    update(i, { tags: [...pairs[i].tags, draft] });
    setTagDraft((prev) => ({ ...prev, [i]: "" }));
  };

  const removeTag = (pairIdx: number, tagIdx: number) =>
    update(pairIdx, { tags: pairs[pairIdx].tags.filter((_, ti) => ti !== tagIdx) });

  return (
    <div className="space-y-2">
      {pairs.map((pair, i) => (
        <div key={i} className="rounded border p-2 dark:border-slate-700">
          <div className="mb-1 flex items-center gap-1">
            <input
              className="w-2/5 rounded border px-2 py-1 text-xs dark:bg-slate-800"
              placeholder="key"
              value={pair.key}
              onChange={(e) => update(i, { key: e.target.value })}
            />
            <button
              type="button"
              onClick={() => update(i, { mode: pair.mode === "list" ? "string" : "list" })}
              className={`rounded px-2 py-0.5 text-xs ${
                pair.mode === "list"
                  ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                  : "border text-slate-500"
              }`}
            >
              {pair.mode === "list" ? "list" : "string"}
            </button>
            <button
              type="button"
              className="ml-auto px-1.5 text-slate-400 hover:text-red-500"
              onClick={() => remove(i)}
              aria-label="Remove"
            >
              ×
            </button>
          </div>
          {pair.mode === "string" ? (
            <input
              className="w-full rounded border px-2 py-1 text-xs dark:bg-slate-800"
              placeholder="value"
              value={pair.value}
              onChange={(e) => update(i, { value: e.target.value })}
            />
          ) : (
            <div>
              <div className="flex flex-wrap gap-1 mb-1">
                {pair.tags.map((tag, ti) => (
                  <span key={ti} className="flex items-center gap-0.5 rounded bg-slate-200 px-1.5 py-0.5 text-xs dark:bg-slate-700">
                    {tag}
                    <button
                      type="button"
                      className="text-slate-400 hover:text-red-500"
                      onClick={() => removeTag(i, ti)}
                      aria-label={`Remove ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                className="w-full rounded border px-2 py-1 text-xs dark:bg-slate-800"
                placeholder="Add value, press Enter or ,"
                value={tagDraft[i] ?? ""}
                onChange={(e) => setTagDraft((prev) => ({ ...prev, [i]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag(i);
                  }
                }}
                onBlur={() => addTag(i)}
              />
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        onClick={add}
      >
        + Add input
      </button>
    </div>
  );
}

interface FormState {
  task_name: string;
  schedule: string;
  enabled: boolean;
  model: string;
  grounding: boolean;
  timeout_ms: number;
  max_retries: string;
  prompt: string;
  variables: KVPair[];
  input: InputPair[];
  outputType: "sns" | "slack" | "webhook";
  sns_topic_arn: string;
  slack_webhook_url: string;
  slack_channel: string;
  webhook_url: string;
  webhook_headers: KVPair[];
}

function buildInitialState(task?: TaskDefinition | null): FormState {
  const outputType = task?.output.type ?? "sns";
  return {
    task_name: task?.task_name ?? "",
    schedule: task?.schedule ?? "",
    enabled: task?.enabled ?? true,
    model: task?.model ?? DEFAULT_MODEL,
    grounding: task?.grounding ?? false,
    timeout_ms: task?.timeout_ms ?? DEFAULT_TIMEOUT,
    max_retries: task?.max_retries !== undefined ? String(task.max_retries) : "",
    prompt: task?.prompt ?? "",
    variables: toKVPairs(task?.variables),
    input: toInputPairs(task?.input),
    outputType: outputType as "sns" | "slack" | "webhook",
    sns_topic_arn: outputType === "sns" && task ? ((task.output as { sns_topic_arn?: string }).sns_topic_arn ?? "") : "",
    slack_webhook_url: outputType === "slack" && task ? ((task.output as { webhook_url: string }).webhook_url ?? "") : "",
    slack_channel: outputType === "slack" && task ? ((task.output as { channel?: string }).channel ?? "") : "",
    webhook_url: outputType === "webhook" && task ? ((task.output as { url: string }).url ?? "") : "",
    webhook_headers: outputType === "webhook" && task ? toKVPairs((task.output as { headers?: Record<string, string> }).headers) : [],
  };
}

function buildTaskPayload(form: FormState): TaskDefinition {
  let output: TaskDefinition["output"];
  if (form.outputType === "sns") {
    output = { type: "sns", ...(form.sns_topic_arn ? { sns_topic_arn: form.sns_topic_arn } : {}) };
  } else if (form.outputType === "slack") {
    output = { type: "slack", webhook_url: form.slack_webhook_url, ...(form.slack_channel ? { channel: form.slack_channel } : {}) };
  } else {
    output = {
      type: "webhook",
      url: form.webhook_url,
      ...(form.webhook_headers.length > 0 ? { headers: fromKVPairs(form.webhook_headers) } : {}),
    };
  }

  const vars = fromKVPairs(form.variables);
  const inp = fromInputPairs(form.input);

  return {
    task_name: form.task_name,
    schedule: form.schedule,
    enabled: form.enabled,
    model: form.model,
    grounding: form.grounding,
    timeout_ms: form.timeout_ms,
    ...(form.max_retries !== "" ? { max_retries: Number(form.max_retries) } : {}),
    prompt: form.prompt,
    ...(Object.keys(vars).length > 0 ? { variables: vars } : {}),
    ...(Object.keys(inp).length > 0 ? { input: inp } : {}),
    output,
  };
}

interface TaskFormDrawerProps {
  open: boolean;
  task: TaskDefinition | null;
  onClose: () => void;
  onSubmit: (data: TaskDefinition) => Promise<void>;
  fieldErrors: ApiFieldError[];
}

export function TaskFormDrawer({ open, task, onClose, onSubmit, fieldErrors }: TaskFormDrawerProps) {
  const isEdit = Boolean(task);
  const [form, setForm] = useState<FormState>(() => buildInitialState(task));
  const [busy, setBusy] = useState(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setForm(buildInitialState(task));
      setLocalErrors({});
    }
  }, [open, task]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, busy, onClose]);

  const apiErrors = Object.fromEntries(fieldErrors.map((f) => [f.field, f.message]));
  const errors = { ...apiErrors, ...localErrors };

  const set = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!isEdit && !form.task_name) errs.task_name = "Required";
    if (!isEdit && !/^[a-z0-9_]+$/.test(form.task_name)) errs.task_name = "Lowercase letters, numbers, underscores only";
    if (!form.schedule) errs.schedule = "Required";
    if (!form.prompt.trim()) errs.prompt = "Required";
    if (form.outputType === "slack" && !form.slack_webhook_url) errs["output.webhook_url"] = "Required";
    if (form.outputType === "webhook" && !form.webhook_url) errs["output.url"] = "Required";
    setLocalErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      await onSubmit(buildTaskPayload(form));
    } finally {
      setBusy(false);
    }
  };

  const variablesMap = Object.fromEntries(form.variables.filter((p) => p.key).map((p) => [p.key, p.value]));
  const inputMap = fromInputPairs(form.input);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => !busy && onClose()}
        aria-hidden="true"
      />
      {/* Slide-over panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? `Edit task ${task?.task_name}` : "Create task"}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-slate-900 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold">{isEdit ? `Edit — ${task?.task_name}` : "New Task"}</h2>
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

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">

            {/* BASIC */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Basic</h3>
              <div className="space-y-3">

                {/* task_name */}
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Task name {isEdit ? <span className="ml-2 font-mono text-slate-600">{task?.task_name}</span> : null}
                  </label>
                  {!isEdit && (
                    <>
                      <input
                        className="w-full rounded border px-3 py-1.5 text-sm dark:bg-slate-800"
                        value={form.task_name}
                        onChange={(e) => set({ task_name: e.target.value.toLowerCase() })}
                        placeholder="my_daily_task"
                        pattern="^[a-z0-9_]+$"
                        autoComplete="off"
                      />
                      {errors.task_name && <p className="mt-0.5 text-xs text-red-500">{errors.task_name}</p>}
                    </>
                  )}
                </div>

                {/* schedule */}
                <div>
                  <label className="mb-1 block text-sm font-medium">Schedule</label>
                  <input
                    className="w-full rounded border px-3 py-1.5 text-sm font-mono dark:bg-slate-800"
                    value={form.schedule}
                    onChange={(e) => set({ schedule: e.target.value })}
                    placeholder="0 8 * * *"
                  />
                  <p className="mt-0.5 text-xs text-slate-400">5-field cron: min hour dom month dow</p>
                  <CronPreview expression={form.schedule} />
                  {errors.schedule && <p className="mt-0.5 text-xs text-red-500">{errors.schedule}</p>}
                </div>

                {/* model */}
                <div>
                  <label className="mb-1 block text-sm font-medium">Model</label>
                  <input
                    className="w-full rounded border px-3 py-1.5 text-sm dark:bg-slate-800"
                    value={form.model}
                    onChange={(e) => set({ model: e.target.value })}
                    placeholder={DEFAULT_MODEL}
                  />
                </div>

                {/* timeout_ms */}
                <div>
                  <label className="mb-1 block text-sm font-medium">Timeout (ms)</label>
                  <input
                    type="number"
                    min={1000}
                    max={300000}
                    step={1000}
                    className="w-full rounded border px-3 py-1.5 text-sm dark:bg-slate-800"
                    value={form.timeout_ms}
                    onChange={(e) => set({ timeout_ms: Number(e.target.value) })}
                  />
                </div>

                {/* max_retries */}
                <div>
                  <label className="mb-1 block text-sm font-medium">Max retries <span className="font-normal text-slate-400">(optional)</span></label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={1}
                    className="w-full rounded border px-3 py-1.5 text-sm dark:bg-slate-800"
                    value={form.max_retries}
                    placeholder="leave blank to omit"
                    onChange={(e) => set({ max_retries: e.target.value })}
                  />
                </div>

                {/* enabled + grounding toggles */}
                <div className="flex gap-6">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <ToggleSwitch checked={form.enabled} onChange={(v) => set({ enabled: v })} />
                    Enabled
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <ToggleSwitch checked={form.grounding} onChange={(v) => set({ grounding: v })} />
                    Grounding
                  </label>
                </div>
              </div>
            </section>

            <hr className="dark:border-slate-700" />

            {/* PROMPT & VARIABLES */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Prompt &amp; Variables</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Prompt</label>
                  <textarea
                    rows={7}
                    className="w-full rounded border px-3 py-1.5 font-mono text-sm dark:bg-slate-800"
                    value={form.prompt}
                    onChange={(e) => set({ prompt: e.target.value })}
                    placeholder="Today's summary for {{city}}..."
                  />
                  {errors.prompt && <p className="mt-0.5 text-xs text-red-500">{errors.prompt}</p>}
                  <PromptPreview prompt={form.prompt} variables={variablesMap} input={inputMap} />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Variables <span className="font-normal text-slate-400">(static string overrides)</span></label>
                  <KVEditor pairs={form.variables} onChange={(v) => set({ variables: v })} addLabel="Add variable" />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Input <span className="font-normal text-slate-400">(dynamic values)</span></label>
                  <InputEditor pairs={form.input} onChange={(v) => set({ input: v })} />
                </div>
              </div>
            </section>

            <hr className="dark:border-slate-700" />

            {/* OUTPUT */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Output</h3>
              <div className="space-y-3">
                {/* Output type segmented control */}
                <div>
                  <label className="mb-1 block text-sm font-medium">Type</label>
                  <div className="inline-flex rounded border">
                    {(["sns", "slack", "webhook"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => set({ outputType: t })}
                        className={`px-3 py-1.5 text-sm first:rounded-l last:rounded-r ${
                          form.outputType === t
                            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                            : "text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {form.outputType === "sns" && (
                  <div>
                    <label className="mb-1 block text-sm font-medium">SNS Topic ARN <span className="font-normal text-slate-400">(optional — uses env default if blank)</span></label>
                    <input
                      className="w-full rounded border px-3 py-1.5 text-sm dark:bg-slate-800"
                      value={form.sns_topic_arn}
                      onChange={(e) => set({ sns_topic_arn: e.target.value })}
                      placeholder="arn:aws:sns:us-east-1:123456789:my-topic"
                    />
                  </div>
                )}

                {form.outputType === "slack" && (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Webhook URL</label>
                      <input
                        type="url"
                        className="w-full rounded border px-3 py-1.5 text-sm dark:bg-slate-800"
                        value={form.slack_webhook_url}
                        onChange={(e) => set({ slack_webhook_url: e.target.value })}
                        placeholder="https://hooks.slack.com/services/..."
                      />
                      {errors["output.webhook_url"] && <p className="mt-0.5 text-xs text-red-500">{errors["output.webhook_url"]}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Channel <span className="font-normal text-slate-400">(optional)</span></label>
                      <input
                        className="w-full rounded border px-3 py-1.5 text-sm dark:bg-slate-800"
                        value={form.slack_channel}
                        onChange={(e) => set({ slack_channel: e.target.value })}
                        placeholder="#general"
                      />
                    </div>
                  </>
                )}

                {form.outputType === "webhook" && (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium">URL</label>
                      <input
                        type="url"
                        className="w-full rounded border px-3 py-1.5 text-sm dark:bg-slate-800"
                        value={form.webhook_url}
                        onChange={(e) => set({ webhook_url: e.target.value })}
                        placeholder="https://api.example.com/webhook"
                      />
                      {errors["output.url"] && <p className="mt-0.5 text-xs text-red-500">{errors["output.url"]}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Headers <span className="font-normal text-slate-400">(optional)</span></label>
                      <KVEditor pairs={form.webhook_headers} onChange={(v) => set({ webhook_headers: v })} addLabel="Add header" />
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t px-4 py-3">
            <button
              type="button"
              className="rounded border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-slate-800"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
              disabled={busy}
              aria-busy={busy}
            >
              {busy ? "Saving..." : isEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 ${
        checked ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}
