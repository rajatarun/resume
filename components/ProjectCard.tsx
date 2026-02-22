import type { ProjectItem } from "@/lib/resume";

export function ProjectCard({ project }: { project: ProjectItem }) {
  return (
    <article className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
      <h2 className="text-xl font-semibold">{project.name}</h2>
      {project.subtitle && <p className="mt-1 text-sm text-zinc-500">{project.subtitle}</p>}
      <ul className="mt-4 space-y-2">
        {project.highlights.map((item) => (
          <li key={item.label} className="text-sm leading-6">
            <span className="font-medium">{item.label}:</span> {item.text}
          </li>
        ))}
      </ul>
    </article>
  );
}
