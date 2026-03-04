'use client';

import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog } from '@/components/admin/agent-management/shared/ConfirmDialog';
import { ErrorBanner } from '@/components/admin/agent-management/shared/ErrorBanner';
import { apiFetch } from '@/components/admin/agent-management/shared/apiFetch';
import { TeamViewDrawer } from '@/components/admin/agent-management/teams/TeamViewDrawer';

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
  result?: {
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
};

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
          onClick={() => {
            void (async () => {
              try {
                const data = await apiFetch<ProvisionTeamsResponse>('/teams', {
                  method: 'POST',
                  body: dryRun ? { dry_run: true } : {},
                });
                setResults(normalizeProvisionResults(data));
                onSuccess(dryRun ? 'Dry run finished' : 'Provision completed');
                await load();
              } catch (err) {
                setError(toErrorMessage(err));
              }
            })();
          }}
        >
          Provision All
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
      {results && (
        <pre className="rounded border bg-slate-50 p-3 text-xs">
          {JSON.stringify(results, null, 2)}
        </pre>
      )}
      {loading ? (
        <div className="rounded border p-4 text-sm">Loading teams...</div>
      ) : (
        <table className="w-full border text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-2 text-left">Team Name</th>
              <th className="p-2 text-left">Team ID</th>
              <th className="p-2 text-left">Version</th>
              <th className="p-2 text-left">Agent Count</th>
              <th className="p-2 text-left">Provisioned</th>
              <th className="p-2 text-left">Owner</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.name} className="border-t">
                <td className="p-2">{team.name}</td>
                <td className="p-2">{team.team_id ?? '—'}</td>
                <td className="p-2">{team.latest_version ?? '—'}</td>
                <td className="p-2">{team.agent_count ?? 0}</td>
                <td className="p-2">{team.provisioned ? '✅' : '⏳'}</td>
                <td className="p-2">{team.owner ?? '—'}</td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="underline"
                      onClick={() => {
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
                      }}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="underline text-red-700"
                      onClick={() => setTeamToDelete(team.name)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
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
