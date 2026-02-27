"use client";

import { useForm } from "react-hook-form";

type FormData = { title: string; sourceInputs: string; tags: string; status: string };

export function ArticleFormModal({ open, busy, onClose, onSubmit }: { open: boolean; busy?: boolean; onClose: () => void; onSubmit: (value: { title: string; sourceInputs?: string[]; tags?: string[]; status?: string }) => void }) {
  const { register, handleSubmit, reset } = useForm<FormData>({ defaultValues: { title: "", sourceInputs: "", tags: "", status: "DRAFT" } });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <form
        className="w-full max-w-xl space-y-3 rounded-xl bg-white p-4 dark:bg-slate-900"
        onSubmit={handleSubmit((values) => {
          onSubmit({
            title: values.title,
            sourceInputs: values.sourceInputs ? values.sourceInputs.split("\n").map((v) => v.trim()).filter(Boolean) : undefined,
            tags: values.tags ? values.tags.split(",").map((v) => v.trim()).filter(Boolean) : undefined,
            status: values.status || undefined
          });
          reset();
        })}
      >
        <h3 className="text-lg font-semibold">Create Draft</h3>
        <input className="w-full rounded border p-2" placeholder="Title" required {...register("title")} />
        <textarea className="min-h-20 w-full rounded border p-2" placeholder="Source inputs (one per line)" {...register("sourceInputs")} />
        <input className="w-full rounded border p-2" placeholder="Tags (comma separated)" {...register("tags")} />
        <select className="w-full rounded border p-2" {...register("status")}>
          <option value="DRAFT">DRAFT</option>
          <option value="REVISION_REQUESTED">REVISION_REQUESTED</option>
        </select>
        <div className="flex justify-end gap-2">
          <button type="button" className="rounded border px-3 py-2" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={busy} className="rounded bg-slate-900 px-3 py-2 text-white disabled:opacity-50">{busy ? "Creating..." : "Create"}</button>
        </div>
      </form>
    </div>
  );
}
