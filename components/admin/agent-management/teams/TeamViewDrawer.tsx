'use client';

import { useRef, useEffect, useState } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { ChatDrawer } from '@/components/admin/agent-management/teams/ChatDrawer';
import {
  canConverse,
  resolveAgentSubstrate,
  type AgentSubstrate,
  type TeamAgent,
} from '@/components/admin/agent-management/shared/substrate';

type ChatAgent = {
  agentName: string;
  substrate: AgentSubstrate;
};

type TeamDetail = {
  team?: {
    team?: Record<string, unknown>;
    globals?: Record<string, unknown>;
    agents?: TeamAgent[];
    workflow?: Array<Record<string, unknown>>;
    schemas?: Record<string, unknown>;
  };
  versions?: string[];
};

const BADGE_CLASS: Record<AgentSubstrate['kind'], string> = {
  agentcore: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  stack: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  classic: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

export function TeamViewDrawer({
  open,
  data,
  onClose,
}: {
  open: boolean;
  data: TeamDetail | null;
  onClose: () => void;
}) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [chatAgent, setChatAgent] = useState<ChatAgent | null>(null);

  useFocusTrap(drawerRef, open && !!data);

  useEffect(() => {
    if (!open) {
      setChatAgent(null);
      return;
    }
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !data) return null;

  const agents = data.team?.agents ?? [];

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-drawer-title"
    >
      <div
        ref={drawerRef}
        className="h-full w-full max-w-xl overflow-auto bg-white p-4 shadow-xl dark:bg-slate-900"
      >
        <div className="flex items-center justify-between">
          <h3 id="team-drawer-title" className="text-lg font-semibold">
            Team Details
          </h3>
          <button
            type="button"
            aria-label="Close team details"
            className="focus-ring rounded border px-3 py-1 text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <pre className="mt-3 overflow-auto rounded border bg-slate-50 p-3 text-xs">
          {JSON.stringify(data.team?.team ?? {}, null, 2)}
        </pre>
        <h4 className="mt-4 font-medium">Globals</h4>
        <pre className="mt-2 overflow-auto rounded border bg-slate-50 p-3 text-xs">
          {JSON.stringify(data.team?.globals ?? {}, null, 2)}
        </pre>
        <h4 className="mt-4 font-medium">Agents</h4>
        <p className="mt-1 text-xs text-slate-500">
          Agents run on AgentCore. One stack runtime serves every agent, so an agent needs no
          identifiers of its own — the ones below appear only where an agent overrides that.
        </p>
        <ul className="mt-2 space-y-1 text-sm">
          {agents.map((agent, index) => {
            const substrate = resolveAgentSubstrate(agent);
            const agentName = agent.name ?? `Agent ${index + 1}`;

            return (
              <li
                key={`${agent.name ?? 'no-name'}:${agent.role_id ?? 'no-role'}:${index}`}
                className="rounded border px-2 py-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{agentName}</span>
                      {agent.role_id && (
                        <span className="text-slate-500">· {agent.role_id}</span>
                      )}
                      <span
                        title={substrate.hint}
                        className={`inline-flex rounded px-2 py-0.5 text-xs ${BADGE_CLASS[substrate.kind]}`}
                      >
                        {substrate.label}
                      </span>
                    </div>
                    {substrate.detail && (
                      <div
                        className="truncate font-mono text-xs text-slate-500"
                        title={substrate.hint}
                      >
                        {substrate.detail}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="focus-ring shrink-0 underline disabled:cursor-not-allowed disabled:text-slate-400"
                    disabled={!canConverse(agent)}
                    onClick={() => setChatAgent({ agentName, substrate })}
                  >
                    Chat
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <h4 className="mt-4 font-medium">Available Versions</h4>
        <select className="focus-ring mt-2 w-full rounded border px-3 py-2">
          {(data.versions ?? []).map((version) => (
            <option key={version}>{version}</option>
          ))}
        </select>
      </div>
      <ChatDrawer
        open={Boolean(chatAgent)}
        substrate={chatAgent?.substrate ?? null}
        agentName={chatAgent?.agentName ?? ''}
        onClose={() => setChatAgent(null)}
      />
    </div>
  );
}
