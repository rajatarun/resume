import { ProjectCard } from "@/components/ProjectCard";
import { resume } from "@/lib/resume";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Projects</h1>
      {resume.projects.map((project) => (
        <ProjectCard key={project.name} project={project} />
      ))}
    </div>
  );
}
