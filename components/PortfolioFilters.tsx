"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";

type ProjectCategory = "Backend" | "Frontend" | "Cloud" | "GenAI";
type Filter = "All" | ProjectCategory;

type Project = {
  id: string;
  title: string;
  description: string;
  url: string;
  homepage: string;
  stars: number;
  forks: number;
  language: string;
  updatedAt: string;
  topics: string[];
  categories: string[];
  architectureDoc: string | null;
};

type ProjectsResponse = {
  generatedAt: string;
  projects: Project[];
};

const filters: Filter[] = ["All", "Backend", "Frontend", "Cloud", "GenAI"];

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

function ProjectRow({ project }: { project: Project }) {
  const [showArch, setShowArch] = useState(false);

  return (
    <Card>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{project.title}</h3>
            {(project.categories.length ? project.categories : ["All"]).map((category) => (
              <Badge key={`${project.id}-${category}`} text={category} />
            ))}
          </div>
          {project.architectureDoc && (
            <button
              onClick={() => setShowArch((prev) => !prev)}
              aria-expanded={showArch}
              className="text-sm font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-2 dark:text-emerald-400"
            >
              {showArch ? "Hide Architecture" : "View Architecture"}
            </button>
          )}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">{project.description || "No description provided."}</p>
        <p className="text-sm">
          <span className="font-medium">Tech:</span>{" "}
          {[project.language, ...project.topics].filter(Boolean).join(", ") || "Not specified"}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">⭐ {project.stars} · Forks {project.forks}</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <a href={project.url} target="_blank" rel="noreferrer" className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 dark:text-sky-300">
            Repository
          </a>
          {project.homepage && (
            <a href={project.homepage} target="_blank" rel="noreferrer" className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 dark:text-sky-300">
              Live Demo
            </a>
          )}
        </div>
        {showArch && project.architectureDoc && <ArchitectureDoc content={project.architectureDoc} />}
      </div>
    </Card>
  );
}

export function PortfolioFilters() {
  const [active, setActive] = useState<Filter>("All");
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      try {
        const response = await fetch("/projects.json", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load projects.json (${response.status})`);
        }
        const data = (await response.json()) as ProjectsResponse;

        if (!cancelled) {
          setProjects(Array.isArray(data.projects) ? data.projects : []);
        }
      } catch {
        if (!cancelled) {
          setProjects([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleProjects = useMemo(() => {
    const filtered = active === "All" ? projects : projects.filter((project) => project.categories.includes(active));
    return [...filtered].sort((a, b) => (b.architectureDoc ? 1 : 0) - (a.architectureDoc ? 1 : 0));
  }, [active, projects]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActive(filter)}
            className={`focus-ring rounded-full border px-4 py-1.5 text-sm ${
              active === filter
                ? "border-sky-400 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-200"
                : "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={`skeleton-${index}`}>
                <div className="space-y-3 animate-pulse">
                  <div className="h-6 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              </Card>
            ))
          : visibleProjects.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
      </div>

      {!isLoading && visibleProjects.length === 0 && <p className="text-sm text-slate-600 dark:text-slate-300">No projects found for this filter.</p>}
    </div>
  );
}
