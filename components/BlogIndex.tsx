"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { blogPosts } from "@/data/posts";
import { Input } from "@/components/Input";
import { Card } from "@/components/Card";

export function BlogIndex() {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("All");

  const tags = useMemo(() => ["All", ...new Set(blogPosts.flatMap((post) => post.tags))], []);

  const filtered = useMemo(
    () =>
      blogPosts.filter((post) => {
        const matchesQuery = [post.title, post.excerpt].join(" ").toLowerCase().includes(query.toLowerCase());
        const matchesTag = tag === "All" || post.tags.includes(tag);
        return matchesQuery && matchesTag;
      }),
    [query, tag]
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <Input aria-label="Search blog posts" placeholder="Search posts..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <select aria-label="Filter posts by tag" value={tag} onChange={(e) => setTag(e.target.value)} className="focus-ring rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
          {tags.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="space-y-4">
        {filtered.map((post) => (
          <Card key={post.slug}>
            <p className="text-xs text-slate-500">{post.date} · {post.readingTime}</p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight">
              <Link href={`/blog/${post.slug}`} className="focus-ring hover:text-sky-600">{post.title}</Link>
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{post.excerpt}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              {post.tags.map((topic) => <span key={topic} className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">#{topic}</span>)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
