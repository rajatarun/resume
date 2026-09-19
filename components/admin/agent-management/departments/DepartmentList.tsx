'use client';

import { useCallback, useEffect, useState } from 'react';
import { DepartmentCreateModal } from '@/components/admin/agent-management/departments/DepartmentCreateModal';
import { DepartmentEditModal } from '@/components/admin/agent-management/departments/DepartmentEditModal';
import { DepartmentViewModal } from '@/components/admin/agent-management/departments/DepartmentViewModal';
import { ErrorBanner } from '@/components/admin/agent-management/shared/ErrorBanner';
import { apiFetch } from '@/components/admin/agent-management/shared/apiFetch';
import { RecordList } from '@/components/admin/agent-management/shared/RecordList';

type Department = {
  department_id: string;
  name?: string;
  slug?: string;
  color?: string;
  description?: string;
  allowed_roles?: string[];
  allowed_schemas?: string[];
};
type Role = { role_id: string; title?: string };
type GetDepartmentsResponse = { departments?: Department[]; result?: { departments?: Department[] } };
type GetDepartmentResponse = { department?: Department; result?: Department | { department?: Department } };

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

  const normalizeDepartments = (data: GetDepartmentsResponse): Department[] =>
    data.result?.departments ?? data.departments ?? [];

  const normalizeDepartment = (data: GetDepartmentResponse): Department | null => {
    const payload = data.result ?? data;
    if ('department_id' in payload && typeof payload.department_id === 'string') {
      return payload as Department;
    }
    if ('department' in payload) {
      return payload.department ?? data.department ?? null;
    }
    return data.department ?? null;
  };

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const [departmentData, roleData] = await Promise.all([
        apiFetch<GetDepartmentsResponse>('/departments'),
        apiFetch<{ roles: Role[] }>('/roles'),
      ]);
      setDepartments(normalizeDepartments(departmentData));
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
        className="focus-ring min-h-[44px] rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700"
        onClick={() => setShowCreate(true)}
      >
        Add Department
      </button>

      <RecordList
        rows={departments}
        rowKey={(department) => department.department_id}
        loading={loading}
        emptyTitle="No departments defined"
        emptyBody="A department groups the roles and schemas a team is allowed to use. Add one to start assigning roles."
        columns={[
          {
            key: 'name',
            header: 'Name',
            primary: true,
            cell: (department) => department.name ?? department.department_id,
          },
          {
            key: 'department_id',
            header: 'Dept ID',
            cell: (department) => <span className="font-mono text-xs">{department.department_id}</span>,
          },
          {
            key: 'roles',
            header: 'Allowed Roles',
            cell: (department) => department.allowed_roles?.length ?? 0,
          },
          {
            key: 'schemas',
            header: 'Allowed Schemas',
            cell: (department) => department.allowed_schemas?.length ?? 0,
          },
        ]}
        actions={[
          {
            label: 'View',
            onClick: (department) => {
              void (async () => {
                try {
                  const details = await apiFetch<GetDepartmentResponse>(
                    `/departments/${encodeURIComponent(department.department_id)}`,
                  );
                  setViewDepartment(normalizeDepartment(details) ?? department);
                } catch (err) {
                  setError(toErrorMessage(err));
                }
              })();
            },
          },
          {
            label: 'Edit',
            onClick: (department) => {
              void (async () => {
                try {
                  const details = await apiFetch<GetDepartmentResponse>(
                    `/departments/${encodeURIComponent(department.department_id)}`,
                  );
                  setEditDepartment(normalizeDepartment(details) ?? department);
                } catch (err) {
                  setError(toErrorMessage(err));
                }
              })();
            },
          },
        ]}
      />
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
