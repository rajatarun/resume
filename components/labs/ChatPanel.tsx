"use client";

import type { LabAgent, LabModel } from "@/lib/agentsCatalog";
import type { CostEstimateOutput } from "@/lib/costEstimate";
import { cn } from "@/lib/utils/cn";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  debug?: {
    jobId: string;
    actualCost: number;
  };
};

type WalletState = {
  connected: boolean;
  address: string | null;
  chainId: number | null;
  isPolygon: boolean;
};

type ChatPanelProps = {
  agent: LabAgent;
  model: LabModel;
  maxOutputTokens: number;
  concise: boolean;
  jsonOutput: boolean;
  draft: string;
  inputTokens: number;
  estimate: CostEstimateOutput;
  isSafe: boolean;
  hasBudgetRemaining: boolean;
  dailyRemainingUsd: number;
  messages: ChatMessage[];
  wallet: WalletState;
  isRunning: boolean;
  onModelChange: (model: LabModel) => void;
  onOutputCapChange: (value: number) => void;
  onConciseChange: (value: boolean) => void;
  onJsonOutputChange: (value: boolean) => void;
  onDraftChange: (value: string) => void;
  onAsk: () => void;
  onClear: () => void;
  onCopyConversation: () => void;
};

const modelOptions: LabModel[] = ["gpt-mini", "gpt-small", "gpt-medium"];

export function ChatPanel({
  agent,
  model,
  maxOutputTokens,
  concise,
  jsonOutput,
  draft,
  inputTokens,
  estimate,
  isSafe,
  hasBudgetRemaining,
  dailyRemainingUsd,
  messages,
  wallet,
  isRunning,
  onModelChange,
  onOutputCapChange,
  onConciseChange,
  onJsonOutputChange,
  onDraftChange,
  onAsk,
  onClear,
  onCopyConversation
}: ChatPanelProps) {
  const canAsk = wallet.connected && isSafe && hasBudgetRemaining && draft.trim().length > 0 && !isRunning;

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="space-y-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{agent.name}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">{agent.description}</p>
          </div>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Model
            <select
              className="focus-ring ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={model}
              onChange={(event) => onModelChange(event.target.value as LabModel)}
            >
              {modelOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Max output tokens: <span className="font-medium">{maxOutputTokens}</span>
            <input
              type="range"
              min={200}
              max={1200}
              step={50}
              value={maxOutputTokens}
              onChange={(event) => onOutputCapChange(Number(event.target.value))}
              className="mt-1 w-full"
            />
          </label>

          <div className="flex gap-4 text-sm text-slate-700 dark:text-slate-300">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={concise} onChange={(event) => onConciseChange(event.target.checked)} />
              Concise
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={jsonOutput} onChange={(event) => onJsonOutputChange(event.target.checked)} />
              JSON output
            </label>
          </div>
        </div>
      </div>

      <div className="sticky top-20 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-950/70">
        <div className="grid gap-1 text-slate-700 dark:text-slate-300">
          <p>Base cost: {estimate.formatted.baseCost}</p>
          <p>Estimated input tokens: {inputTokens}</p>
          <p>Output token cap: {maxOutputTokens}</p>
          <p>Estimated variable cost: {estimate.formatted.variableCost}</p>
          <p className="font-semibold text-slate-900 dark:text-white">Estimated total: {estimate.formatted.totalCost}</p>
          <p>
            Status:{" "}
            {isSafe && hasBudgetRemaining ? (
              <span className="font-medium text-emerald-600">Safe ✅</span>
            ) : (
              <span className="font-medium text-amber-600">Over cap ⚠️ — reduce output cap, switch model, enable concise mode.</span>
            )}
          </p>
          {!hasBudgetRemaining ? (
            <p className="text-amber-600">Daily budget remaining: ${dailyRemainingUsd.toFixed(4)}.</p>
          ) : null}
        </div>
      </div>

      <div className="max-h-[420px] space-y-3 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">No messages yet. Ask the selected agent to get started.</p>
        ) : (
          messages.map((message) => (
            <article key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  message.role === "user"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className="mt-1 text-[11px] opacity-70">{new Date(message.createdAt).toLocaleTimeString()}</p>
                {message.debug ? (
                  <details className="mt-1 text-[11px] opacity-80">
                    <summary className="cursor-pointer">Debug</summary>
                    <p>jobId: {message.debug.jobId}</p>
                    <p>actualCost: ${message.debug.actualCost.toFixed(4)}</p>
                  </details>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>

      <div className="space-y-2">
        <textarea
          rows={4}
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder={`Ask the ${agent.name}…`}
          className="focus-ring w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <p className="text-xs text-slate-500">Token estimate: {inputTokens} · Character count: {draft.length}</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onAsk}
            disabled={!canAsk}
            className="focus-ring rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
          >
            Ask Agent
          </button>
          <button onClick={onClear} className="focus-ring rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Clear chat
          </button>
          <button onClick={onCopyConversation} className="focus-ring rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Copy conversation
          </button>
        </div>
      </div>
    </section>
  );
}
