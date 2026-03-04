'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Json } from '@/components/admin/agent-management/shared/apiFetch';

type Role = Record<string, unknown> & { role_id: string };

export function RoleEditModal({
  open,
  role,
  onClose,
  onSubmit,
}: {
  open: boolean;
  role: Role | null;
  onClose: () => void;
  onSubmit: (payload: Record<string, Json>) => void;
}) {
  const [form, setForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (role) setForm(role);
  }, [role]);

  if (!open || !role) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const patch: Record<string, unknown> = {};
    Object.entries(form).forEach(([key, value]) => {
      if (key !== 'role_id' && value !== role[key]) patch[key] = value;
    });
    onSubmit(patch as Record<string, Json>);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl dark:bg-slate-900"
      >
        <h3 className="text-lg font-semibold">Edit {role.role_id}</h3>
        {Object.entries(form)
          .filter(([key]) => key !== 'role_id' && key !== 'agent_config')
          .map(([key, value]) => (
            <div key={key} className="mt-2">
              <label className="text-xs uppercase text-slate-500">{key}</label>
              <input
                className="w-full rounded border px-3 py-2"
                value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          ))}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded border px-3 py-2" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-white">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
