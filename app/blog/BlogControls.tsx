'use client';

import { useRouter } from 'next/navigation';

export function BlogControls() {
  const router = useRouter();

  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={() => router.refresh()}
        className="focus-ring rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        Refresh
      </button>
    </div>
  );
}
