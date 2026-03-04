'use client';

type TeamDetail = {
  team?: {
    team?: Record<string, unknown>;
    agents?: Array<{ name?: string; role_id?: string; agentId?: string; aliasId?: string }>;
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
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-xl overflow-auto bg-white p-4 shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Team Details</h3>
          <button type="button" className="rounded border px-3 py-1 text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <pre className="mt-3 overflow-auto rounded border bg-slate-50 p-3 text-xs">
          {JSON.stringify(data.team?.team ?? {}, null, 2)}
        </pre>
        <h4 className="mt-4 font-medium">Agents</h4>
        <ul className="mt-2 space-y-1 text-sm">
          {(data.team?.agents ?? []).map((agent, idx) => (
            <li key={`${agent.name}-${idx}`} className="rounded border px-2 py-1">
              {agent.name} · {agent.role_id} · {agent.agentId ?? '—'} · {agent.aliasId ?? '—'}
            </li>
          ))}
        </ul>
        <h4 className="mt-4 font-medium">Available Versions</h4>
        <select className="mt-2 w-full rounded border px-3 py-2">
          {(data.versions ?? []).map((version) => (
            <option key={version}>{version}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
