'use client';

import { useCallback, useEffect, useState } from 'react';
import { DepartmentCreateModal } from '@/components/admin/agent-management/departments/DepartmentCreateModal';
import { DepartmentEditModal } from '@/components/admin/agent-management/departments/DepartmentEditModal';
import { DepartmentViewModal } from '@/components/admin/agent-management/departments/DepartmentViewModal';
import { ErrorBanner } from '@/components/admin/agent-management/shared/ErrorBanner';
import { apiFetch } from '@/components/admin/agent-management/shared/apiFetch';

type Department = {
  department_id: string;
  name?: string;
  slug?: string;
  description?: string;
  allowed_roles?: string[];
  allowed_schemas?: string[];
};
type Role = { role_id: string; title?: string };

function toErrorMessage(error: unknown): string {
  const status = (error as Error & { status?: number }).status;
  if (status && status >= 500) return 'Server error — check Lambda logs';
  return error instanceof Error ? error.message : 'Network error — check your connection';
}

export function DepartmentList({ onSuccess }: { onSuccess: (message: string) => void }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewDepartment, setViewDepartment] = useState<Department | null>(null);
  const [editDepartment, setEditDepartment] = useState<Department | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const [departmentData, roleData] = await Promise.all([
        apiFetch<{ departments: Department[] }>('/departments'),
        apiFetch<{ roles: Role[] }>('/roles'),
      ]);
      setDepartments(departmentData.departments ?? []);
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

  return (
    <div className="space-y-3">
      {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
      <button
        type="button"
        className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
        onClick={() => setShowCreate(true)}
      >
        Add Department
      </button>
      {loading ? (
        <div className="rounded border p-4 text-sm">Loading departments...</div>
      ) : (
        <table className="w-full border text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-2 text-left">Dept ID</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Allowed Roles</th>
              <th className="p-2 text-left">Allowed Schemas</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((department) => (
              <tr key={department.department_id} className="border-t">
                <td className="p-2">{department.department_id}</td>
                <td className="p-2">{department.name ?? '—'}</td>
                <td className="p-2">{department.allowed_roles?.length ?? 0}</td>
                <td className="p-2">{department.allowed_schemas?.length ?? 0}</td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="underline"
                      onClick={() => setViewDepartment(department)}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="underline"
                      onClick={() => setEditDepartment(department)}
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <DepartmentCreateModal
        open={showCreate}
        roles={roles}
        onClose={() => setShowCreate(false)}
        onSubmit={(payload) => {
          void (async () => {
            try {
              await apiFetch('/departments', { method: 'POST', body: payload });
              setShowCreate(false);
              onSuccess('Department created');
              await load();
            } catch (err) {
              setError(toErrorMessage(err));
            }
          })();
        }}
      />
      <DepartmentEditModal
        open={Boolean(editDepartment)}
        department={editDepartment}
        roles={roles}
        onClose={() => setEditDepartment(null)}
        onSubmit={(payload) => {
          void (async () => {
            if (!editDepartment) return;
            try {
              await apiFetch(`/departments/${encodeURIComponent(editDepartment.department_id)}`, {
                method: 'PUT',
                body: payload,
              });
              setEditDepartment(null);
              onSuccess('Department updated');
              await load();
            } catch (err) {
              setError(toErrorMessage(err));
            }
          })();
        }}
      />
      <DepartmentViewModal
        open={Boolean(viewDepartment)}
        department={viewDepartment}
        onClose={() => setViewDepartment(null)}
      />
    </div>
  );
}
