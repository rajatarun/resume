import { ProjectCard } from "@/components/ProjectCard";
import { resume } from "@/lib/resume";

async function fetchArchitectureDoc(githubRepo: string): Promise<string | null> {
  try {
    const url = `https://raw.githubusercontent.com/${githubRepo}/HEAD/docs/architecture.md`;
    const res = await fetch(url, { next: { revalidate: false } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export default async function ProjectsPage() {
  const projectsWithDocs = await Promise.all(
    resume.projects.map(async (project) => {
      const architectureDoc = project.githubRepo
        ? await fetchArchitectureDoc(project.githubRepo)
        : null;
      return { project, architectureDoc };
    })
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Projects</h1>
      {projectsWithDocs.map(({ project, architectureDoc }) => (
        <ProjectCard key={project.name} project={project} architectureDoc={architectureDoc} />
      ))}
    </div>
  );
}
