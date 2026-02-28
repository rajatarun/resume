import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { BlogApiError, getArticle } from '@/lib/api';

const formatDate = (value?: string): string => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

const renderPostBody = (content: string) => {
  const lines = content.split('\n').map((line) => line.trim());
  const blocks: Array<{ type: 'paragraph'; text: string } | { type: 'bullets'; items: string[] }> = [];
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length > 0) {
      blocks.push({ type: 'bullets', items: bulletBuffer });
      bulletBuffer = [];
    }
  };

  for (const line of lines) {
    if (!line) {
      flushBullets();
      continue;
    }

    if (line.startsWith('•')) {
      bulletBuffer.push(line.replace(/^•\s*/, ''));
      continue;
    }

    flushBullets();
    blocks.push({ type: 'paragraph', text: line });
  }

  flushBullets();

  return blocks.map((block, index) => {
    if (block.type === 'bullets') {
      return (
        <ul key={`bullets-${index}`} className="list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-200">
          {block.items.map((item, itemIndex) => (
            <li key={`bullet-${index}-${itemIndex}`}>{item}</li>
          ))}
        </ul>
      );
    }

    return (
      <p key={`paragraph-${index}`} className="text-slate-700 dark:text-slate-200">
        {block.text}
      </p>
    );
  });
};

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const article = await getArticle(params.id);
    return {
      title: article.title,
      description: typeof article.generated?.linkedin_post === 'string' ? article.generated.linkedin_post.slice(0, 160) : 'Blog post',
      openGraph: {
        title: article.title,
        description:
          typeof article.generated?.linkedin_post === 'string'
            ? article.generated.linkedin_post.slice(0, 160)
            : 'Blog post',
        url: `/blog/${article.id}`
      }
    };
  } catch (error) {
    return {
      title: error instanceof BlogApiError && error.status === 404 ? 'Post not found' : 'Blog post'
    };
  }
}

export default async function BlogPostPage({ params }: { params: { id: string } }) {
  try {
    const article = await getArticle(params.id);
    const published = formatDate(article.publishedAt);
    const updated = formatDate(article.updatedAt);
    const intro = [published ? `Published ${published}` : null, updated ? `Updated ${updated}` : null]
      .filter(Boolean)
      .join(' · ');

    return (
      <PageShell title={article.title} intro={intro || 'Article details'}>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {article.tags?.map((tag) => (
              <span key={`${article.id}-${tag}`} className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
                #{tag}
              </span>
            ))}
          </div>

          <article className="space-y-4">{renderPostBody(article.generated?.linkedin_post ?? '')}</article>

          {article.generated?.sources && article.generated.sources.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Sources</h2>
              <ul className="space-y-3">
                {article.generated.sources.map((source, index) => (
                  <li key={`${source.url}-${index}`} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focus-ring font-medium text-sky-600 hover:underline dark:text-sky-400"
                    >
                      {source.title || source.url}
                    </a>
                    {source.notes ? (
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{source.notes}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </PageShell>
    );
  } catch (error) {
    if (error instanceof BlogApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
