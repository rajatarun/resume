"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { ProjectItem } from "@/lib/resume";

function ArchitectureDoc({ content }: { content: string }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="mb-2 text-base font-bold text-slate-900 dark:text-slate-100">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-1 mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-1 mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">{children}</h3>,
          p: ({ children }) => <p className="mb-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 list-disc space-y-0.5 pl-4 text-sm text-slate-600 dark:text-slate-400">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 list-decimal space-y-0.5 pl-4 text-sm text-slate-600 dark:text-slate-400">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
            inline ? (
              <code className="rounded bg-slate-200 px-1 py-0.5 font-mono text-xs text-slate-800 dark:bg-slate-700 dark:text-slate-200">{children}</code>
            ) : (
              <code className="block overflow-x-auto rounded bg-slate-200 p-2 font-mono text-xs text-slate-800 dark:bg-slate-700 dark:text-slate-200">{children}</code>
            ),
          pre: ({ children }) => <pre className="mb-2 overflow-x-auto rounded bg-slate-200 p-2 dark:bg-slate-700">{children}</pre>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-slate-300 pl-3 italic text-slate-500 dark:border-slate-600 dark:text-slate-400">{children}</blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-sky-700 underline decoration-sky-300 underline-offset-2 dark:text-sky-300">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function ProjectCard({
  project,
  architectureDoc,
}: {
  project: ProjectItem;
  architectureDoc?: string | null;
}) {
  const [showArch, setShowArch] = useState(false);

  return (
    <article className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">{project.name}</h2>
          {project.subtitle && <p className="mt-1 text-sm text-zinc-500">{project.subtitle}</p>}
        </div>
        {architectureDoc && (
          <button
            onClick={() => setShowArch((prev) => !prev)}
            aria-expanded={showArch}
            className="text-sm font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-2 dark:text-emerald-400"
          >
            {showArch ? "Hide Architecture" : "View Architecture"}
          </button>
        )}
      </div>

      <ul className="mt-4 space-y-2">
        {project.highlights.map((item) => (
          <li key={item.label} className="text-sm leading-6">
            <span className="font-medium">{item.label}:</span> {item.text}
          </li>
        ))}
      </ul>

      {showArch && architectureDoc && <ArchitectureDoc content={architectureDoc} />}
    </article>
  );
}
