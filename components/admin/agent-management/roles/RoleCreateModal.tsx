'use client';

import { FormEvent, useState } from 'react';
import type { Json } from '@/components/admin/agent-management/shared/apiFetch';

type Department = { department_id: string; name: string };

export function RoleCreateModal({
  open,
  departments,
  onClose,
  onSubmit,
}: {
  open: boolean;
  departments: Department[];
  onClose: () => void;
  onSubmit: (payload: Record<string, Json>) => void;
}) {
  const [form, setForm] = useState({
    role_id: '',
    title: '',
    slug: '',
    level: 'Specialist',
    department_id: '',
    schema_ref: '',
    persona: '',
    primary_task_action: '',
    primary_task_description: '',
  });
  if (!open) return null;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-3xl rounded-xl bg-white p-4 shadow-xl dark:bg-slate-900"
      >
        <h3 className="text-lg font-semibold">Add Role</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            className="rounded border px-3 py-2"
            placeholder="Role ID"
            value={form.role_id}
            onChange={(e) => setForm((p) => ({ ...p, role_id: e.target.value }))}
            required
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            required
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Slug"
            value={form.slug}
            onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            required
          />
          <select
            className="rounded border px-3 py-2"
            value={form.level}
            onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))}
          >
            <option>C-Suite</option>
            <option>Director</option>
            <option>Lead</option>
            <option>Manager</option>
            <option>Specialist</option>
          </select>
          <select
            className="rounded border px-3 py-2"
            value={form.department_id}
            onChange={(e) => setForm((p) => ({ ...p, department_id: e.target.value }))}
          >
            <option value="">Department</option>
            {departments.map((dept) => (
              <option key={dept.department_id} value={dept.department_id}>
                {dept.name}
              </option>
            ))}
          </select>
          <input
            className="rounded border px-3 py-2"
            placeholder="Schema Ref"
            value={form.schema_ref}
            onChange={(e) => setForm((p) => ({ ...p, schema_ref: e.target.value }))}
          />
        </div>
        <textarea
          className="mt-3 min-h-20 w-full rounded border px-3 py-2"
          placeholder="Persona"
          value={form.persona}
          onChange={(e) => setForm((p) => ({ ...p, persona: e.target.value }))}
        />
        <input
          className="mt-3 w-full rounded border px-3 py-2"
          placeholder="Primary Task Action"
          value={form.primary_task_action}
          onChange={(e) => setForm((p) => ({ ...p, primary_task_action: e.target.value }))}
        />
        <textarea
          className="mt-3 min-h-20 w-full rounded border px-3 py-2"
          placeholder="Primary Task Description"
          value={form.primary_task_description}
          onChange={(e) => setForm((p) => ({ ...p, primary_task_description: e.target.value }))}
        />
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
