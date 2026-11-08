import { z } from "zod";
import { resume, type ExperienceItem, type ProjectItem, type SkillGroup } from "@/lib/resume";
import { retrieveResumeContext } from "@/lib/rag/retrieval";
import { PUBLIC_SITE_SECTIONS, resolvePublicSection } from "./publicSurface";

export type WebMcpHandlerError = {
  error: {
    code: "INVALID_INPUT" | "NOT_FOUND" | "UNSUPPORTED";
    message: string;
  };
};

const searchInputSchema = z.object({
  query: z.string().trim().min(1, "query is required"),
  limit: z.number().int().min(1).max(10).optional()
});

const skillsInputSchema = z.object({
  groupName: z.string().trim().min(1).optional()
});

const experienceInputSchema = z.object({
  index: z.number().int().min(0).optional(),
  company: z.string().trim().min(1).optional(),
  role: z.string().trim().min(1).optional()
});

const resumeProjectInputSchema = z.object({
  name: z.string().trim().min(1, "name is required")
});

const githubProjectInputSchema = z.object({
  id: z.string().trim().min(1, "id is required")
});

const sectionInputSchema = z.object({
  sectionId: z.string().trim().min(1, "sectionId is required")
});

function invalidInput(message: string): WebMcpHandlerError {
  return { error: { code: "INVALID_INPUT", message } };
}

function notFound(message: string): WebMcpHandlerError {
  return { error: { code: "NOT_FOUND", message } };
}

export function executeSearchPublicResume(raw: unknown) {
  const parsed = searchInputSchema.safeParse(raw);
  if (!parsed.success) {
    return invalidInput(parsed.error.issues.map((i) => i.message).join("; "));
  }
  const { query, limit = 5 } = parsed.data;
  const matches = retrieveResumeContext(query, limit);
  return {
    query,
    matchCount: matches.length,
    matches: matches.map((m) => ({
      sourceId: m.sourceId,
      section: m.section,
      title: m.title,
      company: m.company ?? null,
      role: m.role ?? null,
      years: m.years ?? null,
      tags: m.tags,
      snippet: m.snippet
    }))
  };
}

function formatSkillGroup(group: SkillGroup) {
  return {
    name: group.name,
    yearsExp: group.yearsExp,
    skills: group.items
  };
}

export function executeListPublicSkills(raw: unknown) {
  const parsed = skillsInputSchema.safeParse(raw ?? {});
  if (!parsed.success) {
    return invalidInput(parsed.error.issues.map((i) => i.message).join("; "));
  }
  const groups = resume.skills.groups;
  if (parsed.data.groupName) {
    const needle = parsed.data.groupName.toLowerCase();
    const group = groups.find((g) => g.name.toLowerCase() === needle);
    if (!group) {
      return notFound(`No skill group named "${parsed.data.groupName}".`);
    }
    return { groups: [formatSkillGroup(group)] };
  }
  return { groups: groups.map(formatSkillGroup) };
}

function formatExperience(item: ExperienceItem) {
  return {
    title: item.title,
    company: item.company,
    startYear: item.startYear,
    endYearOrPresent: item.endYearOrPresent,
    location: item.location ?? null,
    highlights: item.highlights.map((h) => ({ label: h.label, text: h.text }))
  };
}

export function executeGetExperienceEntry(raw: unknown) {
  const parsed = experienceInputSchema.safeParse(raw ?? {});
  if (!parsed.success) {
    return invalidInput(parsed.error.issues.map((i) => i.message).join("; "));
  }
  const { index, company, role } = parsed.data;
  if (index !== undefined) {
    const item = resume.experience[index];
    if (!item) return notFound(`No experience at index ${index}.`);
    return { experience: formatExperience(item) };
  }
  if (company || role) {
    const companyNeedle = company?.toLowerCase();
    const roleNeedle = role?.toLowerCase();
    const matches = resume.experience.filter((exp) => {
      const companyOk = !companyNeedle || exp.company.toLowerCase().includes(companyNeedle);
      const roleOk = !roleNeedle || exp.title.toLowerCase().includes(roleNeedle);
      return companyOk && roleOk;
    });
    if (matches.length === 0) {
      return notFound("No experience entries matched the given filters.");
    }
    return { experience: matches.map(formatExperience) };
  }
  return invalidInput("Provide index, company, and/or role to select an experience entry.");
}

function formatResumeProject(project: ProjectItem) {
  return {
    name: project.name,
    subtitle: project.subtitle ?? null,
    githubRepo: project.githubRepo ?? null,
    highlights: project.highlights.map((h) => ({ label: h.label, text: h.text }))
  };
}

export function executeGetResumeProjectDetails(raw: unknown) {
  const parsed = resumeProjectInputSchema.safeParse(raw);
  if (!parsed.success) {
    return invalidInput(parsed.error.issues.map((i) => i.message).join("; "));
  }
  const needle = parsed.data.name.toLowerCase();
  const project =
    resume.projects.find((p) => p.name.toLowerCase() === needle) ??
    resume.projects.find((p) => p.name.toLowerCase().includes(needle));
  if (!project) {
    return notFound(`No résumé project matching "${parsed.data.name}".`);
  }
  return { project: formatResumeProject(project) };
}

export type PortfolioProject = {
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

let cachedPortfolioProjects: PortfolioProject[] | null = null;

export async function loadPublicPortfolioProjects(): Promise<PortfolioProject[]> {
  if (cachedPortfolioProjects) return cachedPortfolioProjects;
  if (typeof fetch === "undefined") {
    cachedPortfolioProjects = [];
    return cachedPortfolioProjects;
  }
  try {
    const response = await fetch("/projects.json", { cache: "force-cache" });
    if (!response.ok) {
      cachedPortfolioProjects = [];
      return cachedPortfolioProjects;
    }
    const data = (await response.json()) as { projects?: PortfolioProject[] };
    cachedPortfolioProjects = Array.isArray(data.projects) ? data.projects : [];
  } catch {
    cachedPortfolioProjects = [];
  }
  return cachedPortfolioProjects;
}

/** Test hook: reset in-memory portfolio cache. */
export function resetPortfolioProjectCacheForTests() {
  cachedPortfolioProjects = null;
}

export async function executeGetGithubPortfolioProject(raw: unknown) {
  const parsed = githubProjectInputSchema.safeParse(raw);
  if (!parsed.success) {
    return invalidInput(parsed.error.issues.map((i) => i.message).join("; "));
  }
  const projects = await loadPublicPortfolioProjects();
  const needle = parsed.data.id.toLowerCase();
  const project =
    projects.find((p) => p.id.toLowerCase() === needle) ??
    projects.find((p) => p.title.toLowerCase().includes(needle));
  if (!project) {
    return notFound(`No public portfolio project matching id "${parsed.data.id}".`);
  }
  return {
    project: {
      id: project.id,
      title: project.title,
      description: project.description,
      url: project.url,
      homepage: project.homepage || null,
      stars: project.stars,
      forks: project.forks,
      language: project.language,
      topics: project.topics,
      categories: project.categories,
      updatedAt: project.updatedAt
    }
  };
}

export function executeListPublicSiteSections() {
  return {
    sections: PUBLIC_SITE_SECTIONS.map((s) => ({
      sectionId: s.id,
      title: s.title,
      path: s.path,
      description: s.description
    }))
  };
}

export function executeSuggestPublicNavigation(raw: unknown) {
  const parsed = sectionInputSchema.safeParse(raw);
  if (!parsed.success) {
    return invalidInput(parsed.error.issues.map((i) => i.message).join("; "));
  }
  const section = resolvePublicSection(parsed.data.sectionId);
  if (!section) {
    return notFound(
      `Unknown sectionId "${parsed.data.sectionId}". Call list_public_site_sections for valid ids.`
    );
  }
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return {
    sectionId: section.id,
    title: section.title,
    path: section.path,
    absoluteUrl: origin ? `${origin}${section.path}` : section.path,
    note: "Read-only suggestion. Opening the URL is left to the user or assistive UI."
  };
}
