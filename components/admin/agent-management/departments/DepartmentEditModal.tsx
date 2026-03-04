'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Json } from '@/components/admin/agent-management/shared/apiFetch';

type Department = {
  department_id: string;
  name?: string;
  slug?: string;
  description?: string;
  allowed_roles?: string[];
  allowed_schemas?: string[];
};
type Role = { role_id: string; title?: string };

export function DepartmentEditModal({
  open,
  department,
  roles,
  onClose,
  onSubmit,
}: {
  open: boolean;
  department: Department | null;
  roles: Role[];
  onClose: () => void;
  onSubmit: (payload: Record<string, Json>) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    allowed_roles: [] as string[],
    allowed_schemas: '',
  });

  useEffect(() => {
    if (department) {
      setForm({
        name: department.name ?? '',
        slug: department.slug ?? '',
        description: department.description ?? '',
        allowed_roles: department.allowed_roles ?? [],
        allowed_schemas: (department.allowed_schemas ?? []).join(','),
      });
    }
  }, [department]);

  if (!open || !department) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({
      name: form.name,
      slug: form.slug,
      description: form.description,
      allowed_roles: form.allowed_roles,
      allowed_schemas: form.allowed_schemas
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl dark:bg-slate-900"
      >
        <h3 className="text-lg font-semibold">Edit {department.department_id}</h3>
        <p className="mt-1 text-xs text-amber-700">
          New entries will be added to the existing list — existing entries are not removed.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            className="rounded border px-3 py-2"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Slug"
            value={form.slug}
            onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
          />
        </div>
        <textarea
          className="mt-3 min-h-20 w-full rounded border px-3 py-2"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        />
        <input
          className="mt-3 w-full rounded border px-3 py-2"
          placeholder="Allowed Schemas (comma-separated)"
          value={form.allowed_schemas}
          onChange={(e) => setForm((p) => ({ ...p, allowed_schemas: e.target.value }))}
        />
        <div className="mt-3 rounded border p-2">
          <p className="text-xs uppercase text-slate-500">Allowed Roles</p>
          <div className="mt-1 grid grid-cols-2 gap-1 text-sm">
            {roles.map((role) => (
              <label key={role.role_id} className="flex gap-2">
                <input
                  type="checkbox"
                  checked={form.allowed_roles.includes(role.role_id)}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      allowed_roles: e.target.checked
                        ? [...p.allowed_roles, role.role_id]
                        : p.allowed_roles.filter((item) => item !== role.role_id),
                    }))
                  }
                />
                {role.title ?? role.role_id}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded border px-3 py-2" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-white">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
