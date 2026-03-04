'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { AgentCreateModal } from '@/components/admin/agent-management/agents/AgentCreateModal';
import { AgentEditModal } from '@/components/admin/agent-management/agents/AgentEditModal';
import { ConfirmDialog } from '@/components/admin/agent-management/shared/ConfirmDialog';
import { ErrorBanner } from '@/components/admin/agent-management/shared/ErrorBanner';
import { apiFetch } from '@/components/admin/agent-management/shared/apiFetch';

type Agent = { agentName: string; agentStatus?: string; foundationModel?: string };
type AgentDetail = {
  agent: {
    agentName: string;
    instruction?: string;
    description?: string;
    foundationModel?: string;
  };
  aliases: string[];
};
type Role = { role_id: string; title?: string };

function toErrorMessage(error: unknown): string {
  const status = (error as Error & { status?: number }).status;
  if (status && status >= 500) return 'Server error — check Lambda logs';
  return error instanceof Error ? error.message : 'Network error — check your connection';
}

export function AgentList({ onSuccess }: { onSuccess: (message: string) => void }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<Record<string, AgentDetail>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<AgentDetail['agent'] | null>(null);
  const [confirmNames, setConfirmNames] = useState<string[] | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const [agentData, roleData] = await Promise.all([
        apiFetch<{ agents: Agent[] }>('/agents'),
        apiFetch<{ roles: Role[] }>('/roles'),
      ]);
      setAgents(agentData.agents ?? []);
      setRoles(roleData.roles ?? []);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const statusClass = (status?: string): string => {
    if (status === 'PREPARED') return 'bg-emerald-100 text-emerald-700';
    if (status === 'NOT_PREPARED') return 'bg-amber-100 text-amber-700';
    if (status === 'FAILED') return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-600';
  };

  const toggleExpand = async (name: string): Promise<void> => {
    if (expanded[name]) {
      setExpanded((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
      return;
    }

    try {
      const data = await apiFetch<AgentDetail>(`/agents/${encodeURIComponent(name)}`);
      setExpanded((prev) => ({ ...prev, [name]: data }));
    } catch (err) {
      setError(toErrorMessage(err));
    }
  };

  const createAgent = async (payload: Record<string, string>): Promise<void> => {
    try {
      await apiFetch('/agents', { method: 'POST', body: payload });
      setCreateOpen(false);
      onSuccess('Agent created');
      await load();
    } catch (err) {
      setError(toErrorMessage(err));
    }
  };

  const saveEdit = async (payload: {
    instruction: string;
    description: string;
    foundationModel: string;
  }): Promise<void> => {
    if (!editAgent) return;

    try {
      await apiFetch(`/agents/${encodeURIComponent(editAgent.agentName)}`, {
        method: 'PUT',
        body: payload,
      });
      setEditAgent(null);
      onSuccess('Agent updated');
      await load();
    } catch (err) {
      setError(toErrorMessage(err));
    }
  };

  const deleteNames = async (names: string[]): Promise<void> => {
    try {
      await apiFetch('/agents', { method: 'DELETE', body: { agent_names: names } });
      setSelected([]);
      setConfirmNames(null);
      onSuccess(`Deleted ${names.length} agent(s)`);
      await load();
    } catch (err) {
      setError(toErrorMessage(err));
    }
  };

  return (
    <div className="space-y-3">
      {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
          onClick={() => setCreateOpen(true)}
        >
          Create Agent
        </button>
        <button
          type="button"
          className="rounded border px-3 py-2 text-sm disabled:opacity-50"
          disabled={!selected.length}
          onClick={() => setConfirmNames(selected)}
        >
          Delete Selected
        </button>
      </div>
      {loading ? (
        <div className="rounded border p-4 text-sm">Loading agents...</div>
      ) : (
        <table className="w-full border text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-2" />
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Model</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <Fragment key={agent.agentName}>
                <tr className="border-t">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      aria-label={`Select ${agent.agentName}`}
                      checked={selected.includes(agent.agentName)}
                      onChange={(event) =>
                        setSelected((prev) =>
                          event.target.checked
                            ? [...prev, agent.agentName]
                            : prev.filter((name) => name !== agent.agentName),
                        )
                      }
                    />
                  </td>
                  <td className="p-2">{agent.agentName}</td>
                  <td className="p-2">
                    <span className={`rounded px-2 py-1 text-xs ${statusClass(agent.agentStatus)}`}>
                      {agent.agentStatus ?? 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="p-2">{agent.foundationModel ?? '—'}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="underline"
                        onClick={() => {
                          void toggleExpand(agent.agentName);
                        }}
                      >
                        {expanded[agent.agentName] ? 'Collapse' : 'Expand'}
                      </button>
                      <button
                        type="button"
                        className="underline"
                        onClick={() => {
                          void (async () => {
                            try {
                              const details = await apiFetch<AgentDetail>(
                                `/agents/${encodeURIComponent(agent.agentName)}`,
                              );
                              setEditAgent(details.agent);
                            } catch (err) {
                              setError(toErrorMessage(err));
                            }
                          })();
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="underline text-red-700"
                        onClick={() => setConfirmNames([agent.agentName])}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                {expanded[agent.agentName] && (
                  <tr className="border-t bg-slate-50">
                    <td className="p-2" colSpan={5}>
                      <p>
                        <strong>Instruction:</strong>{' '}
                        {expanded[agent.agentName].agent.instruction ?? '—'}
                      </p>
                      <p>
                        <strong>Aliases:</strong>{' '}
                        {expanded[agent.agentName].aliases?.join(', ') || 'None'}
                      </p>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
      <AgentCreateModal
        open={createOpen}
        roles={roles}
        onClose={() => setCreateOpen(false)}
        onSubmit={(payload) => {
          void createAgent(payload);
        }}
      />
      <AgentEditModal
        open={Boolean(editAgent)}
        agent={editAgent}
        onClose={() => setEditAgent(null)}
        onSubmit={(payload) => {
          void saveEdit(payload);
        }}
      />
      <ConfirmDialog
        open={Boolean(confirmNames)}
        title="Delete agents"
        confirmText="Delete"
        onCancel={() => setConfirmNames(null)}
        onConfirm={() => {
          if (confirmNames) {
            void deleteNames(confirmNames);
          }
        }}
      >
        Delete these agents: <strong>{confirmNames?.join(', ')}</strong>
      </ConfirmDialog>
    </div>
  );
}
