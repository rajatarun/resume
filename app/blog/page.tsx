import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/Card';
import { PageShell } from '@/components/PageShell';
import { BlogControls } from '@/app/blog/BlogControls';
import { getBlogCards } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read practical posts from Tarun Raja on cloud, GenAI, leadership, and mentoring.',
  openGraph: {
    title: 'Tarun Raja Blog',
    description: 'Insights on engineering leadership, cloud architecture, and GenAI execution.',
    url: '/blog'
  }
};

const formatDate = (value?: string): string => {
  if (!value) {
    return 'Date unavailable';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

export default async function BlogPage() {
  const { items } = await getBlogCards();

  return (
    <PageShell
      title="Blog"
      intro="Practical writing on architecture decisions, product engineering, and mentoring patterns from real-world delivery."
    >
      <div className="space-y-4">
        <BlogControls />
        <div className="space-y-4">
          {items.map((post) => (
            <Card key={post.id}>
              <p className="text-xs text-slate-500">{formatDate(post.publishedAt)}</p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight">
                <Link href={`/blog/${post.id}`} className="focus-ring hover:text-sky-600">
                  {post.title}
                </Link>
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{post.excerpt}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                {post.tags?.map((topic) => (
                  <span key={`${post.id}-${topic}`} className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
                    #{topic}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
