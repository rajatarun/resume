'use client';

import { JsonViewer } from '@/components/admin/agent-management/shared/JsonViewer';

export function RoleConfigModal({
  open,
  config,
  onClose,
}: {
  open: boolean;
  config: unknown;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Role Agent Config</h3>
          <button type="button" className="rounded border px-3 py-1 text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mt-3">
          <JsonViewer value={config} />
        </div>
      </div>
    </div>
  );
}
