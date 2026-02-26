import { CopyButton } from "@/components/admin/CopyButton";

export function TextareaWithCopy({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <CopyButton text={value ?? ""} />
      </div>
      <textarea value={value ?? ""} readOnly className="min-h-32 w-full rounded border bg-slate-50 p-2 text-sm dark:bg-slate-950" />
    </div>
  );
}
