import type { Metadata } from "next";
import { BlogIndex } from "@/components/BlogIndex";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Blog",
  description: "Read practical posts from Tarun Raja on cloud, GenAI, leadership, and mentoring.",
  openGraph: {
    title: "Tarun Raja Blog",
    description: "Insights on engineering leadership, cloud architecture, and GenAI execution.",
    url: "/blog"
  }
};

export default function BlogPage() {
  return (
    <PageShell title="Blog" intro="Practical writing on architecture decisions, product engineering, and mentoring patterns from real-world delivery.">
      <BlogIndex />
    </PageShell>
  );
}
