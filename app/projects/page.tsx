import type { Metadata } from "next";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { projects } from "@/data/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "Projects archive with stacks, tags, and measurable outcomes.",
  openGraph: {
    title: "Tarun Raja Projects",
    description: "Backend, frontend, cloud, and GenAI project highlights.",
    url: "/projects"
  }
};

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <h1 className="text-3xl font-semibold tracking-tight">Projects archive</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">Selected projects with technology tags and impact outcomes.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.id}>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{project.title}</h2>
              <Badge text={project.category} />
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{project.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {project.stack.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {tag}
                </span>
              ))}
            </div>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {project.impact.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
