import { resumeData } from "@/lib/data/resume";

export default function ProjectsPage() {
  return (
    <section className="prose-card">
      <h1 className="mb-4 text-2xl font-bold">Projects</h1>
      <div className="space-y-4">
        {resumeData.projects.map((project) => (
          <article key={project.name}>
            <h2 className="font-semibold">{project.name}</h2>
            <p>{project.description}</p>
            <p className="text-sm text-slate-500">{project.tech.join(" · ")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
