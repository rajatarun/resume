'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/components/admin/agent-management/shared/apiFetch';
import { ErrorBanner } from '@/components/admin/agent-management/shared/ErrorBanner';
import { RecordList } from '@/components/admin/agent-management/shared/RecordList';
import {
  composePromptPreview,
  flattenAgents,
  promptWarnings,
  withUpdatedPrompt,
  type AgentRow,
  type TeamDoc,
} from '@/components/admin/agent-management/shared/agentPrompts';
import { PromptEditorDrawer } from '@/components/admin/agent-management/agents/PromptEditorDrawer';

type TeamsResponse = { teams?: Array<{ name: string }>; result?: { teams?: Array<{ name: string }> } };
type TeamDetail = { team?: TeamDoc; result?: { team?: TeamDoc } };

function toErrorMessage(error: unknown): string {
  const status = (error as Error & { status?: number }).status;
  if (status && status >= 500) return 'Server error — check Lambda logs';
  return error instanceof Error ? error.message : 'Network error — check your connection';
}

/**
 * Agents as they actually run, and the system prompts that drive them.
 *
 * The previous tab listed Bedrock Agents Classic and edited their
 * `instruction`. TeamWeave runs on AgentCore, Classic provisioning is skipped
 * on every deploy, and the agents that execute live in the team configs where
 * the system prompt is `goal_template` — so those edits changed a resource
 * nothing invokes, and said "Agent updated".
 */
export function AgentPromptsTab({ onSuccess }: { onSuccess: (message: string) => void }) {
  const [teams, setTeams] = useState<Record<string, TeamDoc>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<AgentRow | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const list = await apiFetch<TeamsResponse>('/teams');
      const names = (list.result?.teams ?? list.teams ?? []).map((t) => t.name).filter(Boolean);
      const docs: Record<string, TeamDoc> = {};
      // Sequential rather than parallel: a dozen teams is not worth a burst
      // against an API whose writes are already async and rate-limited.
      for (const name of names) {
        try {
          const detail = await apiFetch<TeamDetail>(`/teams/${encodeURIComponent(name)}`);
          const doc = detail.result?.team ?? detail.team;
          if (doc) docs[name] = doc;
        } catch {
          // One unreadable team must not blank the whole tab.
          setError(`Could not load team ${name}; the rest are shown.`);
        }
      }
      setTeams(docs);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => flattenAgents(teams), [teams]);

  const savePrompt = async (row: AgentRow, prompt: string): Promise<void> => {
    const doc = teams[row.teamName];
    if (!doc) return;
    const next = withUpdatedPrompt(doc, row.agentId, prompt);
    if (next === doc) {
      setEditing(null);
      return; // Nothing changed; do not rewrite the config.
    }
    await apiFetch(`/teams/${encodeURIComponent(row.teamName)}`, { method: 'PUT', body: next });
    setEditing(null);
    // Writes are asynchronous — the API returns 202 and nothing has happened
    // yet, so this says what was accepted rather than what is true.
    onSuccess(`Prompt update for ${row.displayName} accepted — reload to confirm it applied.`);
    await load();
  };

  return (
    <div className="space-y-3">
      {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

      <p className="text-sm text-slate-600 dark:text-slate-300">
        Every agent that runs, in pipeline order, with the system prompt that drives it. These come
        from the team configs the orchestrator reads — not from Bedrock Agents Classic, which is
        deprecated and which no run invokes.
      </p>

      <RecordList
        rows={rows}
        rowKey={(row) => row.key}
        loading={loading}
        emptyTitle="No agents yet"
        emptyBody="Agents are defined in a team's team.json. Once a team is registered its agents appear here with their system prompts."
        columns={[
          {
            key: 'agent',
            header: 'Agent',
            primary: true,
            cell: (row) => (
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{row.displayName}</span>
                  {row.orphaned ? (
                    <span
                      title="No workflow step runs this agent."
                      className="inline-flex rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                    >
                      Not in workflow
                    </span>
                  ) : (
                    <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      Step {row.stepNumber}
                    </span>
                  )}
                </div>
                <div className="truncate font-mono text-xs text-slate-500">{row.agentId}</div>
              </div>
            ),
          },
          { key: 'team', header: 'Team', cell: (row) => row.teamName || '—' },
          { key: 'role', header: 'Role', cell: (row) => row.roleId || '—' },
          {
            key: 'prompt',
            header: 'System prompt',
            cell: (row) => (
              <span className="line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                {row.prompt.trim() || <em className="text-amber-600">not set</em>}
              </span>
            ),
          },
          {
            key: 'schema',
            header: 'Output schema',
            tableOnly: true,
            cell: (row) => <span className="font-mono text-xs">{row.schemaRef || '—'}</span>,
          },
          {
            key: 'warnings',
            header: 'Checks',
            cell: (row) => {
              const warnings = promptWarnings(row);
              if (!warnings.length) {
                return <span className="text-xs text-slate-400">OK</span>;
              }
              return (
                <span
                  title={warnings.join('\n')}
                  className="inline-flex rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                >
                  {warnings.length} to review
                </span>
              );
            },
          },
        ]}
        actions={[{ label: 'Edit prompt', onClick: (row) => setEditing(row) }]}
      />

      <PromptEditorDrawer
        open={Boolean(editing)}
        row={editing}
        preview={editing ? composePromptPreview(editing, teams[editing.teamName] ?? {}) : ''}
        warnings={editing ? promptWarnings(editing) : []}
        onClose={() => setEditing(null)}
        onSave={savePrompt}
      />
    </div>
  );
}
