'use client';

type Department = {
  name?: string;
  description?: string;
  allowed_roles?: string[];
  allowed_schemas?: string[];
};

export function DepartmentViewModal({
  open,
  department,
  onClose,
}: {
  open: boolean;
  department: Department | null;
  onClose: () => void;
}) {
  if (!open || !department) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{department.name}</h3>
          <button type="button" className="rounded border px-3 py-1 text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="mt-3 text-sm">{department.description || 'No description'}</p>
        <div className="mt-3">
          <p className="text-xs uppercase text-slate-500">Allowed Roles</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {(department.allowed_roles ?? []).map((role) => (
              <span key={role} className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                {role}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xs uppercase text-slate-500">Allowed Schemas</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {(department.allowed_schemas ?? []).map((schema) => (
              <span key={schema} className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                {schema}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
