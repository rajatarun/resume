'use client';

import { useEffect, useState } from 'react';
import { type BlogCard, getBlogCards } from '@/lib/api';

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

export function NewsletterPastIssues() {
  const [issues, setIssues] = useState<BlogCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadIssues = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getBlogCards();
        if (active) {
          setIssues(response.items);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load past issues.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadIssues();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading past issues…</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>;
  }

  if (issues.length === 0) {
    return <p className="text-sm text-slate-500">No issues available yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {issues.map((issue) => (
        <li key={issue.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <p className="text-xs text-slate-500">{formatDate(issue.publishedAt)}</p>
          <h3 className="font-medium">{issue.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">{issue.excerpt}</p>
        </li>
      ))}
    </ul>
  );
}
