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
type TeamDetail = {
  team?: {
    team?: Record<string, unknown>;
    agents?: Array<{ name?: string; role_id?: string; agentId?: string; aliasId?: string }>;
  };
  versions?: string[];
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

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await apiFetch<{ teams: Team[] }>('/teams');
      setTeams(data.teams ?? []);
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
                const data = await apiFetch<{ results?: Record<string, unknown> }>('/teams', {
                  method: 'POST',
                  body: dryRun ? { dry_run: true } : {},
                });
                setResults(data.results ?? null);
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
                              await apiFetch<TeamDetail>(`/teams/${encodeURIComponent(team.name)}`),
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
