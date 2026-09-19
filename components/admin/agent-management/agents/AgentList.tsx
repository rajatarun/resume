'use client';

import { useCallback, useEffect, useState } from 'react';
import { AgentCreateModal } from '@/components/admin/agent-management/agents/AgentCreateModal';
import { AgentEditModal } from '@/components/admin/agent-management/agents/AgentEditModal';
import { ConfirmDialog } from '@/components/admin/agent-management/shared/ConfirmDialog';
import { ErrorBanner } from '@/components/admin/agent-management/shared/ErrorBanner';
import { apiFetch } from '@/components/admin/agent-management/shared/apiFetch';
import { RecordList } from '@/components/admin/agent-management/shared/RecordList';

type Agent = { agentName: string; agentStatus?: string; foundationModel?: string };
type GetAgentsResponse = { agents?: Agent[]; result?: { agents?: Agent[] } };
type AgentAlias = { agentAliasName?: string };
type AgentDetail = {
  agent: {
    agentName: string;
    instruction?: string;
    description?: string;
    foundationModel?: string;
  };
  aliases: AgentAlias[] | string[];
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

  const normalizeAgentDetail = (data: {
    agent?: AgentDetail['agent'];
    aliases?: AgentDetail['aliases'];
    result?: {
      agent?: AgentDetail['agent'];
      aliases?: AgentDetail['aliases'];
    };
  }): AgentDetail => {
    const payload = data.result ?? data;
    return {
      agent: payload.agent ?? { agentName: '' },
      aliases: payload.aliases ?? [],
    };
  };

  const aliasNames = (aliases: AgentDetail['aliases']): string[] =>
    aliases
      .map((alias) => (typeof alias === 'string' ? alias : alias.agentAliasName ?? ''))
      .filter(Boolean);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const [agentData, roleData] = await Promise.all([
        apiFetch<GetAgentsResponse>('/agents'),
        apiFetch<{ roles: Role[] }>('/roles'),
      ]);
      setAgents(agentData.result?.agents ?? agentData.agents ?? []);
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
    if (status === 'PREPARED') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
    if (status === 'NOT_PREPARED') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    if (status === 'FAILED') return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
    return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
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
      const data = await apiFetch<{
        agent?: AgentDetail['agent'];
        aliases?: AgentDetail['aliases'];
        result?: {
          agent?: AgentDetail['agent'];
          aliases?: AgentDetail['aliases'];
        };
      }>(`/agents/${encodeURIComponent(name)}`);
      setExpanded((prev) => ({ ...prev, [name]: normalizeAgentDetail(data) }));
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

  const openEdit = async (name: string): Promise<void> => {
    try {
      const details = await apiFetch<{
        agent?: AgentDetail['agent'];
        aliases?: AgentDetail['aliases'];
        result?: { agent?: AgentDetail['agent']; aliases?: AgentDetail['aliases'] };
      }>(`/agents/${encodeURIComponent(name)}`);
      setEditAgent(normalizeAgentDetail(details).agent);
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
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="focus-ring min-h-[44px] rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700"
          onClick={() => setCreateOpen(true)}
        >
          Create Agent
        </button>
        <button
          type="button"
          className="focus-ring min-h-[44px] rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          disabled={!selected.length}
          onClick={() => setConfirmNames(selected)}
        >
          {selected.length ? `Delete ${selected.length} selected` : 'Delete Selected'}
        </button>
      </div>

      <RecordList
        rows={agents}
        rowKey={(agent) => agent.agentName}
        loading={loading}
        emptyTitle="No agents yet"
        emptyBody="Bedrock agents created here appear in this list. Create one to get started, or check the agent management API if you expected agents to be here already."
        emptyAction={
          <button
            type="button"
            className="focus-ring min-h-[44px] rounded-lg bg-slate-900 px-4 text-sm font-medium text-white"
            onClick={() => setCreateOpen(true)}
          >
            Create Agent
          </button>
        }
        selection={{
          isSelected: (agent) => selected.includes(agent.agentName),
          label: (agent) => `Select ${agent.agentName}`,
          onToggle: (agent, next) =>
            setSelected((prev) =>
              next ? [...prev, agent.agentName] : prev.filter((name) => name !== agent.agentName),
            ),
        }}
        columns={[
          {
            key: 'name',
            header: 'Name',
            primary: true,
            cell: (agent) => agent.agentName,
          },
          {
            key: 'status',
            header: 'Status',
            cell: (agent) => (
              <span className={`inline-flex rounded px-2 py-1 text-xs ${statusClass(agent.agentStatus)}`}>
                {agent.agentStatus ?? 'UNKNOWN'}
              </span>
            ),
          },
          {
            key: 'model',
            header: 'Model',
            cell: (agent) => (
              <span className="font-mono text-xs">{agent.foundationModel ?? '—'}</span>
            ),
          },
        ]}
        actions={[
          {
            label: 'Details',
            onClick: (agent) => {
              void toggleExpand(agent.agentName);
            },
          },
          {
            label: 'Edit',
            onClick: (agent) => {
              void openEdit(agent.agentName);
            },
          },
          {
            label: 'Delete',
            danger: true,
            onClick: (agent) => setConfirmNames([agent.agentName]),
          },
        ]}
        expanded={(agent) => {
          const detail = expanded[agent.agentName];
          if (!detail) return null;
          return (
            <dl className="space-y-1.5 text-sm">
              <div>
                <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">Instruction</dt>
                <dd className="text-slate-900 dark:text-slate-100">{detail.agent.instruction ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">Aliases</dt>
                <dd className="text-slate-900 dark:text-slate-100">
                  {aliasNames(detail.aliases).join(', ') || 'None'}
                </dd>
              </div>
            </dl>
          );
        }}
      />

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
