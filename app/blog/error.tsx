'use client';

import { PageShell } from '@/components/PageShell';

export default function BlogError({ error: _error, reset }: { error: Error; reset: () => void }) {
  return (
    <PageShell title="Blog" intro="We couldn't load posts right now.">
      <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
        <p>Please try again.</p>
        <button
          type="button"
          onClick={() => reset()}
          className="focus-ring rounded-xl border border-rose-300 bg-white px-3 py-2 font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-900/40"
        >
          Retry
        </button>
      </div>
    </PageShell>
  );
}
