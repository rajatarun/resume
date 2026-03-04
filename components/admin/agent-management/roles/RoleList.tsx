'use client';

import { useCallback, useEffect, useState } from 'react';
import { RoleConfigModal } from '@/components/admin/agent-management/roles/RoleConfigModal';
import { RoleCreateModal } from '@/components/admin/agent-management/roles/RoleCreateModal';
import { RoleEditModal } from '@/components/admin/agent-management/roles/RoleEditModal';
import { ErrorBanner } from '@/components/admin/agent-management/shared/ErrorBanner';
import { apiFetch } from '@/components/admin/agent-management/shared/apiFetch';

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
        className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
        onClick={() => setShowCreate(true)}
      >
        Add Role
      </button>
      {loading ? (
        <div className="rounded border p-4 text-sm">Loading roles...</div>
      ) : (
        <table className="w-full border text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-2 text-left">Role ID</th>
              <th className="p-2 text-left">Title</th>
              <th className="p-2 text-left">Level</th>
              <th className="p-2 text-left">Department</th>
              <th className="p-2 text-left">Schema Ref</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.role_id} className="border-t">
                <td className="p-2">{role.role_id}</td>
                <td className="p-2">{role.title ?? '—'}</td>
                <td className="p-2">{role.level ?? '—'}</td>
                <td className="p-2">{role.department_id ?? '—'}</td>
                <td className="p-2">{role.schema_ref ?? '—'}</td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="underline"
                      onClick={() => {
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
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="underline"
                      onClick={() => setConfig(role.agent_config ?? {})}
                    >
                      View Config
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
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
