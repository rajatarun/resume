import Link from 'next/link';
import { PageShell } from '@/components/PageShell';

export default function BlogPostNotFound() {
  return (
    <PageShell title="Post not found" intro="This article may have been removed or is not published yet.">
      <Link href="/blog" className="focus-ring text-sky-600 hover:underline dark:text-sky-400">
        Back to blog
      </Link>
    </PageShell>
  );
}
