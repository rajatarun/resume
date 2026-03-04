'use client';

import { FormEvent, useEffect, useState } from 'react';

type Agent = {
  agentName: string;
  instruction?: string;
  description?: string;
  foundationModel?: string;
};

export function AgentEditModal({
  open,
  agent,
  onClose,
  onSubmit,
  busy,
}: {
  open: boolean;
  agent: Agent | null;
  onClose: () => void;
  onSubmit: (payload: {
    instruction: string;
    description: string;
    foundationModel: string;
  }) => void;
  busy?: boolean;
}) {
  const [form, setForm] = useState({ instruction: '', description: '', foundationModel: '' });

  useEffect(() => {
    if (agent) {
      setForm({
        instruction: agent.instruction ?? '',
        description: agent.description ?? '',
        foundationModel: agent.foundationModel ?? 'amazon.nova-micro-v1:0',
      });
    }
  }, [agent]);

  if (!open || !agent) return null;

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
        <h3 className="text-lg font-semibold">Edit {agent.agentName}</h3>
        <textarea
          className="mt-3 min-h-28 w-full rounded border px-3 py-2"
          placeholder="Instruction"
          value={form.instruction}
          onChange={(e) => setForm((p) => ({ ...p, instruction: e.target.value }))}
        />
        <input
          className="mt-3 w-full rounded border px-3 py-2"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        />
        <input
          className="mt-3 w-full rounded border px-3 py-2"
          placeholder="Foundation Model"
          value={form.foundationModel}
          onChange={(e) => setForm((p) => ({ ...p, foundationModel: e.target.value }))}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded border px-3 py-2" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-white">
            {busy ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
