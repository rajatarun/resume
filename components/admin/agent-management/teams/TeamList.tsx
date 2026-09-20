'use client';

import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog } from '@/components/admin/agent-management/shared/ConfirmDialog';
import { ErrorBanner } from '@/components/admin/agent-management/shared/ErrorBanner';
import { apiFetch } from '@/components/admin/agent-management/shared/apiFetch';
import { RecordList } from '@/components/admin/agent-management/shared/RecordList';
import { TeamViewDrawer } from '@/components/admin/agent-management/teams/TeamViewDrawer';
import type { TeamAgent } from '@/components/admin/agent-management/shared/substrate';

type Team = {
  name: string;
  team_id?: string;
  latest_version?: string;
  agent_count?: number;
  provisioned?: boolean;
  owner?: string;
};
type GetTeamsResponse = { teams?: Team[]; result?: { teams?: Team[] } };
type ProvisionTeamsResponse = {
  results?: Record<string, unknown>;
  result?: { results?: Record<string, unknown> };
};
type TeamPayload = {
  team?: Record<string, unknown>;
  globals?: Record<string, unknown>;
  agents?: TeamAgent[];
  workflow?: Array<Record<string, unknown>>;
  schemas?: Record<string, unknown>;
};
type TeamDetail = {
  team?: TeamPayload;
  versions?: string[];
  result?: {
    team?: TeamPayload;
    versions?: string[];
  };
};

/**
 * Why this whole control is now a legacy affordance. Teams run on AgentCore,
 * where one stack runtime serves every agent and nothing per-agent is created.
 * This button still calls the Classic provisioner, which creates Bedrock
 * Agents Classic resources that no run invokes -- so a team showing no Classic
 * agents is working normally, and pressing this is only for a rollback to
 * AGENT_RUNTIME=classic.
 */
const CLASSIC_PROVISIONING_NOTE =
  'Creates Bedrock Agents Classic resources. Teams run on AgentCore, where one ' +
  'stack runtime serves every agent — so this is only needed to roll back to ' +
  'the Classic substrate.';

function toErrorMessage(error: unknown): string {
  const status = (error as Error & { status?: number }).status;
  if (status && status >= 500) return 'Server error — check Lambda logs';
  return error instanceof Error ? error.message : 'Network error — check your connection';
}

export function TeamList({ onSuccess }: { onSuccess: (message: string) => void }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dryRun, setDryRun] = useState(false);
  const [results, setResults] = useState<Record<string, unknown> | null>(null);
  const [teamDetail, setTeamDetail] = useState<TeamDetail | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);

  const normalizeTeams = (data: GetTeamsResponse): Team[] => data.result?.teams ?? data.teams ?? [];

  const normalizeProvisionResults = (
    data: ProvisionTeamsResponse,
  ): Record<string, unknown> | null => data.result?.results ?? data.results ?? null;

  const normalizeTeamDetail = (data: TeamDetail): TeamDetail => {
    const payload = data.result ?? data;
    if (payload.team?.team) return payload;

    return {
      team: {
        team: payload.team,
      },
      versions: payload.versions,
    };
  };

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await apiFetch<GetTeamsResponse>('/teams');
      setTeams(normalizeTeams(data));
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-3">
      {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
          title={CLASSIC_PROVISIONING_NOTE}
          onClick={() => {
            void (async () => {
              try {
                const data = await apiFetch<ProvisionTeamsResponse>('/teams', {
                  method: 'POST',
                  body: dryRun ? { dry_run: true } : {},
                });
                setResults(normalizeProvisionResults(data));
                onSuccess(
                  dryRun ? 'Dry run finished' : 'Bedrock Agents Classic provisioning completed',
                );
                await load();
              } catch (err) {
                setError(toErrorMessage(err));
              }
            })();
          }}
        >
          Provision Classic Agents
        </button>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(event) => setDryRun(event.target.checked)}
          />
          Dry Run
        </label>
      </div>
      <p className="text-xs text-slate-500">{CLASSIC_PROVISIONING_NOTE}</p>
      {results && (
        <pre className="rounded border bg-slate-50 p-3 text-xs">
          {JSON.stringify(results, null, 2)}
        </pre>
      )}
      <RecordList
        rows={teams}
        rowKey={(team) => team.name}
        loading={loading}
        emptyTitle="No teams yet"
        emptyBody="A team is a pipeline of agents defined by a team.json in S3. Once one is registered it appears here with its provisioning state."
        columns={[
          { key: 'name', header: 'Team Name', primary: true, cell: (team) => team.name },
          {
            key: 'team_id',
            header: 'Team ID',
            cell: (team) => <span className="font-mono text-xs">{team.team_id ?? '—'}</span>,
          },
          { key: 'version', header: 'Version', cell: (team) => team.latest_version ?? '—' },
          { key: 'agents', header: 'Agents', cell: (team) => team.agent_count ?? 0 },
          {
            key: 'provisioned',
            header: 'Classic agents',
            cell: (team) => (
              // The emoji alone carried the whole meaning and reads as nothing
              // to a screen reader. The header says "Classic agents" because
              // that is all this flag ever tracked -- and now that AgentCore
              // serves every team, a "Pending" here is the expected state, not
              // something to go and fix.
              <span
                title={CLASSIC_PROVISIONING_NOTE}
                className={`inline-flex rounded px-2 py-1 text-xs ${
                  team.provisioned
                    ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {team.provisioned ? 'Provisioned' : 'None'}
              </span>
            ),
          },
          { key: 'owner', header: 'Owner', tableOnly: true, cell: (team) => team.owner ?? '—' },
        ]}
        actions={[
          {
            label: 'View',
            onClick: (team) => {
              void (async () => {
                try {
                  setTeamDetail(
                    normalizeTeamDetail(
                      await apiFetch<TeamDetail>(`/teams/${encodeURIComponent(team.name)}`),
                    ),
                  );
                } catch (err) {
                  setError(toErrorMessage(err));
                }
              })();
            },
          },
          { label: 'Delete', danger: true, onClick: (team) => setTeamToDelete(team.name) },
        ]}
      />
      <TeamViewDrawer
        open={Boolean(teamDetail)}
        data={teamDetail}
        onClose={() => setTeamDetail(null)}
      />
      <ConfirmDialog
        open={Boolean(teamToDelete)}
        title="Delete team"
        confirmText="Delete Team"
        onCancel={() => setTeamToDelete(null)}
        onConfirm={() => {
          void (async () => {
            if (!teamToDelete) return;
            try {
              await apiFetch(`/teams/${encodeURIComponent(teamToDelete)}`, { method: 'DELETE' });
              onSuccess(`Deleted team ${teamToDelete}`);
              setTeamToDelete(null);
              await load();
            } catch (err) {
              setError(toErrorMessage(err));
            }
          })();
        }}
      >
        Delete team <strong>{teamToDelete}</strong>? This removes all team agents and S3 versions.
      </ConfirmDialog>
    </div>
  );
}
