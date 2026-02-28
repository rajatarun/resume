"use client";

import { useEffect, useMemo, useState } from "react";
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
};

type ProjectsResponse = {
  generatedAt: string;
  projects: Project[];
};

const filters: Filter[] = ["All", "Backend", "Frontend", "Cloud", "GenAI"];

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
    if (active === "All") return projects;
    return projects.filter((project) => project.categories.includes(active));
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
              <Card key={project.id}>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{project.title}</h3>
                    {(project.categories.length ? project.categories : ["All"]).map((category) => (
                      <Badge key={`${project.id}-${category}`} text={category} />
                    ))}
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
                </div>
              </Card>
            ))}
      </div>

      {!isLoading && visibleProjects.length === 0 && <p className="text-sm text-slate-600 dark:text-slate-300">No projects found for this filter.</p>}
    </div>
  );
}
