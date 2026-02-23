"use client";

import { useMemo, useState } from "react";
import { projects, ProjectCategory } from "@/data/projects";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";

const filters: ("All" | ProjectCategory)[] = ["All", "Backend", "Frontend", "Cloud", "GenAI"];

export function PortfolioFilters() {
  const [active, setActive] = useState<(typeof filters)[number]>("All");

  const visibleProjects = useMemo(() => {
    if (active === "All") return projects;
    return projects.filter((project) => project.category === active);
  }, [active]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button key={filter} onClick={() => setActive(filter)} className={`focus-ring rounded-full border px-4 py-1.5 text-sm ${active === filter ? "border-sky-400 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-200" : "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}>
            {filter}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {visibleProjects.map((project) => (
          <Card key={project.id}>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{project.title}</h3>
                <Badge text={project.category} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{project.summary}</p>
              <p className="text-sm"><span className="font-medium">Tech:</span> {project.stack.join(", ")}</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                {project.impact.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
