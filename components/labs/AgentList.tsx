"use client";

import type { LabAgent } from "@/lib/agentsCatalog";
import { AgentRow } from "@/components/labs/AgentRow";

type AgentListProps = {
  agents: LabAgent[];
  selectedAgentId: string;
  search: string;
  onSearchChange: (value: string) => void;
  onSelectAgent: (id: string) => void;
  onViewPrompt: (agent: LabAgent) => void;
};

export function AgentList({
  agents,
  selectedAgentId,
  search,
  onSearchChange,
  onSelectAgent,
  onViewPrompt
}: AgentListProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="agent-search">
        Agent Directory
      </label>
      <input
        id="agent-search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search agents…"
        className="focus-ring w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      />
      <div className="space-y-2">
        {agents.map((agent) => (
          <AgentRow
            key={agent.id}
            agent={agent}
            selected={selectedAgentId === agent.id}
            onSelect={() => onSelectAgent(agent.id)}
            onViewPrompt={() => onViewPrompt(agent)}
          />
        ))}
      </div>
    </section>
  );
}
