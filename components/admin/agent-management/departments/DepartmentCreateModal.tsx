'use client';

import { FormEvent, useState } from 'react';
import type { Json } from '@/components/admin/agent-management/shared/apiFetch';

type Role = { role_id: string; title?: string };

export function DepartmentCreateModal({
  open,
  roles,
  onClose,
  onSubmit,
}: {
  open: boolean;
  roles: Role[];
  onClose: () => void;
  onSubmit: (payload: Record<string, Json>) => void;
}) {
  const [form, setForm] = useState({
    department_id: '',
    name: '',
    slug: '',
    description: '',
    allowed_roles: [] as string[],
    allowed_schemas: '',
  });
  if (!open) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({
      ...form,
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
        <h3 className="text-lg font-semibold">Add Department</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            className="rounded border px-3 py-2"
            placeholder="Department ID"
            value={form.department_id}
            onChange={(e) => setForm((p) => ({ ...p, department_id: e.target.value }))}
            required
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Slug"
            value={form.slug}
            onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Allowed Schemas (comma-separated)"
            value={form.allowed_schemas}
            onChange={(e) => setForm((p) => ({ ...p, allowed_schemas: e.target.value }))}
          />
        </div>
        <textarea
          className="mt-3 min-h-20 w-full rounded border px-3 py-2"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
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
