'use client';

import { FormEvent, useState } from 'react';
import { BTN_PRIMARY, BTN_SECONDARY, FIELD, TEXTAREA } from '@/components/admin/agent-management/shared/controls';

type Role = { role_id: string; title?: string };

export function AgentCreateModal({
  open,
  roles,
  onClose,
  onSubmit,
  busy,
}: {
  open: boolean;
  roles: Role[];
  onClose: () => void;
  onSubmit: (payload: Record<string, string>) => void;
  busy?: boolean;
}) {
  const [form, setForm] = useState({
    name: '',
    role: '',
    goal_template: '',
    schema_ref: '',
    foundation_model: 'amazon.nova-micro-v1:0',
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
        className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl dark:bg-slate-900"
      >
        <h3 className="text-lg font-semibold">Create Agent</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            className={FIELD}
            placeholder="Name"
            aria-label="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <select
            className={FIELD}
            aria-label="Role"
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            required
          >
            <option value="">Select Role</option>
            {roles.map((role) => (
              <option key={role.role_id} value={role.role_id}>
                {role.title ?? role.role_id}
              </option>
            ))}
          </select>
          <input
            className={FIELD}
            placeholder="Schema Ref"
            aria-label="Schema Ref"
            value={form.schema_ref}
            onChange={(e) => setForm((p) => ({ ...p, schema_ref: e.target.value }))}
          />
          <input
            className={FIELD}
            placeholder="Foundation Model"
            aria-label="Foundation Model"
            value={form.foundation_model}
            onChange={(e) => setForm((p) => ({ ...p, foundation_model: e.target.value }))}
          />
        </div>
        <textarea
          className={`mt-3 min-h-28 w-full ${TEXTAREA}`}
          placeholder="Goal Template"
            aria-label="Goal Template"
          value={form.goal_template}
          onChange={(e) => setForm((p) => ({ ...p, goal_template: e.target.value }))}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={BTN_SECONDARY} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={BTN_PRIMARY}>
            {busy ? 'Saving...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
