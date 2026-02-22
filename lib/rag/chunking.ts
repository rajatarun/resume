import type { ResumeData } from "@/lib/resume";

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

export function buildChunks(resume: ResumeData): ResumeChunk[] {
  const chunks: ResumeChunk[] = [
    {
      sourceId: "profile-summary",
      section: "profile",
      title: "Profile Summary",
      tags: [resume.header.name, resume.header.location],
      snippet: resume.profile.summary
    }
  ];

  resume.experience.forEach((exp, idx) => {
    chunks.push({
      sourceId: `experience-${idx}`,
      section: "experience",
      title: `${exp.title} at ${exp.company}`,
      company: exp.company,
      role: exp.title,
      years: `${exp.startYear} - ${exp.endYearOrPresent}`,
      tags: [exp.company, exp.title],
      snippet: exp.highlights.map((h) => `${h.label}: ${h.text}`).join(" ")
    });
  });

  resume.skills.groups.forEach((group, idx) => {
    chunks.push({
      sourceId: `skills-${idx}`,
      section: "skills",
      title: `${group.name} skills`,
      tags: group.items,
      snippet: `${group.name}: ${group.items.join(", ")}`
    });
  });

  resume.projects.forEach((project, idx) => {
    chunks.push({
      sourceId: `project-${idx}`,
      section: "projects",
      title: project.name,
      tags: project.highlights.map((h) => h.label),
      snippet: project.highlights.map((h) => `${h.label}: ${h.text}`).join(" ")
    });
  });

  return chunks;
}
