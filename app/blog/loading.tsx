import { Card } from '@/components/Card';
import { PageShell } from '@/components/PageShell';

export default function BlogLoading() {
  return (
    <PageShell title="Blog" intro="Loading posts...">
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-3 h-6 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
