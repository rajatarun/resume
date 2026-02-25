"use client";

import type { LabAgent } from "@/lib/agentsCatalog";
import { formatUsd } from "@/lib/costEstimate";
import { cn } from "@/lib/utils/cn";

type AgentRowProps = {
  agent: LabAgent;
  selected: boolean;
  onSelect: () => void;
  onViewPrompt: () => void;
};

export function AgentRow({ agent, selected, onSelect, onViewPrompt }: AgentRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "focus-ring w-full cursor-pointer rounded-xl border p-4 text-left transition",
        selected
          ? "border-slate-400 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/60"
          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{agent.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{agent.title}</p>
        </div>
        <div className="text-right text-xs text-slate-600 dark:text-slate-300">
          <p>Base {formatUsd(agent.baseCostUsd)}</p>
          {agent.typicalCostRangeUsd ? (
            <p>
              Typical {formatUsd(agent.typicalCostRangeUsd[0])}–{formatUsd(agent.typicalCostRangeUsd[1])}
            </p>
          ) : null}
        </div>
      </div>
      <p className="mt-2 line-clamp-1 text-sm text-slate-700 dark:text-slate-300">{agent.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {agent.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300">
            {tag}
          </span>
        ))}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onViewPrompt();
          }}
          className="focus-ring ml-auto text-xs font-medium text-slate-700 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
          View prompt
        </button>
      </div>
    </div>
  );
}
