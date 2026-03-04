'use client';

export function JsonViewer({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[50vh] overflow-auto rounded border bg-slate-50 p-3 text-xs">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
