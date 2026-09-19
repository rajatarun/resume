'use client';

import { useCallback, useEffect, useState } from 'react';
import { RoleConfigModal } from '@/components/admin/agent-management/roles/RoleConfigModal';
import { RoleCreateModal } from '@/components/admin/agent-management/roles/RoleCreateModal';
import { RoleEditModal } from '@/components/admin/agent-management/roles/RoleEditModal';
import { ErrorBanner } from '@/components/admin/agent-management/shared/ErrorBanner';
import { apiFetch } from '@/components/admin/agent-management/shared/apiFetch';
import { RecordList } from '@/components/admin/agent-management/shared/RecordList';

type Role = {
  role_id: string;
  title?: string;
  level?: string;
  department_id?: string;
  schema_ref?: string;
  agent_config?: unknown;
} & Record<string, unknown>;
type Department = { department_id: string; name: string };
type GetRolesResponse = { roles?: Role[]; result?: { roles?: Role[] } };
type GetRoleResponse = { role?: Role; result?: Role | { role?: Role } };

function isRole(value: unknown): value is Role {
  return (
    typeof value === 'object' &&
    value !== null &&
    'role_id' in value &&
    typeof value.role_id === 'string'
  );
}

function toErrorMessage(error: unknown): string {
  const status = (error as Error & { status?: number }).status;
  if (status && status >= 500) return 'Server error — check Lambda logs';
  return error instanceof Error ? error.message : 'Network error — check your connection';
}

export function RoleList({ onSuccess }: { onSuccess: (message: string) => void }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [config, setConfig] = useState<unknown | null>(null);

  const normalizeRoles = (data: GetRolesResponse): Role[] => data.result?.roles ?? data.roles ?? [];

  const normalizeRole = (data: GetRoleResponse): Role | null => {
    const payload = data.result ?? data;
    if (isRole(payload)) return payload;
    if (isRole(payload.role)) return payload.role;
    if (isRole(data.role)) return data.role;
    return null;
  };

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const [roleData, departmentData] = await Promise.all([
        apiFetch<GetRolesResponse>('/roles'),
        apiFetch<{ departments: Department[] }>('/departments'),
      ]);
      setRoles(normalizeRoles(roleData));
      setDepartments(departmentData.departments ?? []);
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
      <button
        type="button"
        className="focus-ring min-h-[44px] rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700"
        onClick={() => setShowCreate(true)}
      >
        Add Role
      </button>

      <RecordList
        rows={roles}
        rowKey={(role) => role.role_id}
        loading={loading}
        emptyTitle="No roles defined"
        emptyBody="Roles describe what an agent is for and which schema its output is validated against. Add one before creating agents that reference it."
        columns={[
          { key: 'title', header: 'Title', primary: true, cell: (role) => role.title ?? role.role_id },
          { key: 'role_id', header: 'Role ID', cell: (role) => <span className="font-mono text-xs">{role.role_id}</span> },
          { key: 'level', header: 'Level', cell: (role) => role.level ?? '—' },
          { key: 'department', header: 'Department', cell: (role) => role.department_id ?? '—' },
          {
            key: 'schema',
            header: 'Schema Ref',
            tableOnly: true,
            cell: (role) => <span className="font-mono text-xs">{role.schema_ref ?? '—'}</span>,
          },
        ]}
        actions={[
          {
            label: 'Edit',
            onClick: (role) => {
              void (async () => {
                try {
                  const details = await apiFetch<GetRoleResponse>(
                    `/roles/${encodeURIComponent(role.role_id)}`,
                  );
                  setEditRole(normalizeRole(details) ?? role);
                } catch (err) {
                  setError(toErrorMessage(err));
                }
              })();
            },
          },
          {
            label: 'View Config',
            onClick: (role) => setConfig(role.agent_config ?? {}),
          },
        ]}
      />

      <RoleCreateModal
        open={showCreate}
        departments={departments}
        onClose={() => setShowCreate(false)}
        onSubmit={(payload) => {
          void (async () => {
            try {
              await apiFetch('/roles', { method: 'POST', body: payload });
              setShowCreate(false);
              onSuccess('Role added');
              await load();
            } catch (err) {
              setError(toErrorMessage(err));
            }
          })();
        }}
      />
      <RoleEditModal
        open={Boolean(editRole)}
        role={editRole}
        onClose={() => setEditRole(null)}
        onSubmit={(payload) => {
          void (async () => {
            if (!editRole) return;
            try {
              await apiFetch(`/roles/${encodeURIComponent(editRole.role_id)}`, {
                method: 'PUT',
                body: payload,
              });
              setEditRole(null);
              onSuccess('Role updated');
              await load();
            } catch (err) {
              setError(toErrorMessage(err));
            }
          })();
        }}
      />
      <RoleConfigModal open={config !== null} config={config} onClose={() => setConfig(null)} />
    </div>
  );
}
