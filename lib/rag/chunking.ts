import type { Resume } from "@/lib/data/types";

export type ResumeChunk = {
  sourceId: string;
  section: string;
  title: string;
  company?: string;
  role?: string;
  years?: string;
  tags: string[];
  snippet: string;
};

export function buildChunks(resume: Resume): ResumeChunk[] {
  const chunks: ResumeChunk[] = [
    {
      sourceId: "profile-summary",
      section: "profile",
      title: "Profile Summary",
      tags: [resume.profile.title, resume.profile.location],
      snippet: resume.profile.summary
    }
  ];

  resume.experience.forEach((exp, idx) => {
    chunks.push({
      sourceId: `experience-${idx}`,
      section: "experience",
      title: `${exp.role} at ${exp.company}`,
      company: exp.company,
      role: exp.role,
      years: exp.years,
      tags: [exp.company, exp.role],
      snippet: exp.bullets.join(" ")
    });
  });

  resume.skills.forEach((group, idx) => {
    chunks.push({
      sourceId: `skills-${idx}`,
      section: "skills",
      title: `${group.group} skills`,
      tags: group.items,
      snippet: `${group.group}: ${group.items.join(", ")}`
    });
  });

  resume.projects.forEach((project, idx) => {
    chunks.push({
      sourceId: `project-${idx}`,
      section: "projects",
      title: project.name,
      tags: project.tech,
      snippet: `${project.description} Tech: ${project.tech.join(", ")}`
    });
  });

  return chunks;
}
