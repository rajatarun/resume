'use client';

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-slate-100 p-5 h-28 dark:border-slate-700 dark:bg-slate-800" />
  );
}

export function SkeletonRow() {
  return <div className="animate-pulse h-9 rounded bg-slate-100 dark:bg-slate-800" />;
}

export function SkeletonChart({ height = 256 }: { height?: number }) {
  return (
    <div
      className="animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800 w-full"
      style={{ height }}
    />
  );
}
