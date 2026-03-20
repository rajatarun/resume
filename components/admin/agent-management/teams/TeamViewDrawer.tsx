'use client';

import { useRef, useEffect } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

type TeamDetail = {
  team?: {
    team?: Record<string, unknown>;
    globals?: Record<string, unknown>;
    agents?: Array<{
      name?: string;
      role_id?: string;
      bedrock?: { agentId?: string; aliasId?: string };
      agentId?: string;
      aliasId?: string;
    }>;
    workflow?: Array<Record<string, unknown>>;
    schemas?: Record<string, unknown>;
  };
  versions?: string[];
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
  useFocusTrap(drawerRef, open && !!data);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !data) return null;

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
          <h3 id="team-drawer-title" className="text-lg font-semibold">Team Details</h3>
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
        <ul className="mt-2 space-y-1 text-sm">
          {(data.team?.agents ?? []).map((agent) => (
            <li key={`${agent.bedrock?.agentId ?? agent.agentId ?? 'no-agent'}:${agent.bedrock?.aliasId ?? agent.aliasId ?? 'no-alias'}:${agent.role_id ?? 'no-role'}:${agent.name ?? 'no-name'}`} className="rounded border px-2 py-1">
              {agent.name} · {agent.role_id} · {agent.bedrock?.agentId ?? agent.agentId ?? '—'} · {agent.bedrock?.aliasId ?? agent.aliasId ?? '—'}
            </li>
          ))}
        </ul>
        <h4 className="mt-4 font-medium">Available Versions</h4>
        <select className="focus-ring mt-2 w-full rounded border px-3 py-2">
          {(data.versions ?? []).map((version) => (
            <option key={version}>{version}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
