'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/Card';
import { PageShell } from '@/components/PageShell';
import { type Article, type BlogCard, getArticle, getBlogCards } from '@/lib/api';

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

type ContentBlock = { type: 'paragraph'; text: string } | { type: 'bullets'; items: string[] };

const parsePostBody = (content: string): ContentBlock[] => {
  const lines = content.split('\n').map((line) => line.trim());
  const blocks: ContentBlock[] = [];
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
  return blocks;
};

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogCard[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadPosts = async () => {
    setListLoading(true);
    setListError(null);

    try {
      const response = await getBlogCards();
      setPosts(response.items);
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Unable to load posts.');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  useEffect(() => {
    if (!selectedPostId) {
      return;
    }

    let active = true;

    const loadArticle = async () => {
      setDetailLoading(true);
      setDetailError(null);

      try {
        const article = await getArticle(selectedPostId);
        if (active) {
          setSelectedArticle(article);
        }
      } catch (error) {
        if (active) {
          const fallback = 'Unable to load article details.';
          setDetailError(error instanceof Error ? error.message : fallback);
          setSelectedArticle(null);
        }
      } finally {
        if (active) {
          setDetailLoading(false);
        }
      }
    };

    void loadArticle();

    return () => {
      active = false;
    };
  }, [selectedPostId]);

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedPostId) ?? null,
    [posts, selectedPostId]
  );

  const closeDetails = () => {
    setSelectedPostId(null);
    setSelectedArticle(null);
    setDetailError(null);
    setDetailLoading(false);
  };

  const articleBodyBlocks = parsePostBody(selectedArticle?.generated?.linkedin_post ?? '');

  return (
    <PageShell
      title="Blog"
      intro="Practical writing on architecture decisions, product engineering, and mentoring patterns from real-world delivery."
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              void loadPosts();
            }}
            className="focus-ring rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>

        {listError ? (
          <Card>
            <p className="text-sm text-rose-600 dark:text-rose-300">{listError}</p>
          </Card>
        ) : null}

        {listLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={`blog-skeleton-${index}`}>
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-3 h-6 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <p className="text-xs text-slate-500">{formatDate(post.publishedAt)}</p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight">{post.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{post.excerpt}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  {post.tags?.map((topic) => (
                    <span key={`${post.id}-${topic}`} className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
                      #{topic}
                    </span>
                  ))}
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPostId(post.id);
                      setSelectedArticle(null);
                      setDetailError(null);
                    }}
                    className="focus-ring rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    Read full post
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedPostId ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 sm:items-center" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-tight">{selectedArticle?.title ?? selectedPost?.title ?? 'Loading article...'}</h2>
              <button
                type="button"
                onClick={closeDetails}
                className="focus-ring rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            {detailLoading ? <p className="mt-4 text-sm text-slate-500">Loading article details…</p> : null}
            {detailError ? <p className="mt-4 text-sm text-rose-600 dark:text-rose-300">{detailError}</p> : null}

            {selectedArticle ? (
              <div className="mt-4 space-y-5">
                <p className="text-sm text-slate-500">
                  Published {formatDate(selectedArticle.publishedAt)} · Updated {formatDate(selectedArticle.updatedAt)}
                </p>

                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  {selectedArticle.tags?.map((tag) => (
                    <span key={`${selectedArticle.id}-${tag}`} className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
                      #{tag}
                    </span>
                  ))}
                </div>

                <article className="space-y-4">
                  {articleBodyBlocks.map((block, index) => {
                    if (block.type === 'bullets') {
                      return (
                        <ul key={`detail-bullets-${index}`} className="list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-200">
                          {block.items.map((item, itemIndex) => (
                            <li key={`detail-bullet-${index}-${itemIndex}`}>{item}</li>
                          ))}
                        </ul>
                      );
                    }

                    return (
                      <p key={`detail-paragraph-${index}`} className="text-slate-700 dark:text-slate-200">
                        {block.text}
                      </p>
                    );
                  })}
                </article>

                {selectedArticle.generated?.sources && selectedArticle.generated.sources.length > 0 ? (
                  <section className="space-y-3">
                    <h3 className="text-lg font-semibold">Sources</h3>
                    <ul className="space-y-2">
                      {selectedArticle.generated.sources.map((source, index) => (
                        <li key={`${source.url}-${index}`}>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="focus-ring text-sky-700 underline dark:text-sky-300"
                          >
                            {source.title || source.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
