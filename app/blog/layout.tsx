import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read practical posts from Tarun Raja on cloud, GenAI, leadership, and mentoring.',
  openGraph: {
    title: 'Tarun Raja Blog',
    description: 'Insights on engineering leadership, cloud architecture, and GenAI execution.',
    url: '/blog'
  }
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
