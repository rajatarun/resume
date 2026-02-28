import { PageShell } from '@/components/PageShell';

export default function BlogPostLoading() {
  return (
    <PageShell title="Loading post..." intro="Fetching article content">
      <div className="space-y-3">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </PageShell>
  );
}
