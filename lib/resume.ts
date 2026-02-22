import rawResume from "@/data/resume.json";

export type ResumeData = typeof rawResume;
export type SkillGroup = ResumeData["skills"]["groups"][number];
export type ExperienceItem = ResumeData["experience"][number];
export type ProjectItem = ResumeData["projects"][number];

export const resume = rawResume;

export function getHeadline(summary: string): string {
  const firstSentence = summary.split(".")[0]?.trim();
  return firstSentence ? `${firstSentence}.` : summary;
}

export function buildResumeContext(data: ResumeData): string {
  const skills = data.skills.groups
    .map((group) => `${group.name}: ${group.items.join(", ")}`)
    .join(" | ");

  const experience = data.experience
    .map(
      (item) =>
        `${item.title} @ ${item.company} (${item.startYear}-${item.endYearOrPresent}) ${
          item.location ? `[${item.location}]` : ""
        } :: ${item.highlights.map((h) => `${h.label}=${h.text}`).join(" ; ")}`
    )
    .join(" || ");

  const projects = data.projects
    .map((project) => `${project.name}${project.subtitle ? ` (${project.subtitle})` : ""}: ${project.highlights.map((h) => `${h.label}=${h.text}`).join(" ; ")}`)
    .join(" || ");

  const education = data.education
    .map((item) => `${item.school} ${item.year} ${item.degree}${item.details ? ` (${item.details})` : ""}`)
    .join(" | ");

  const certifications = data.certifications.map((cert) => `${cert.year}: ${cert.name}`).join(" | ");

  return [
    `Name: ${data.header.name}`,
    `Location: ${data.header.location}`,
    `Profile: ${data.profile.summary}`,
    `Skills: ${skills}`,
    `Experience: ${experience}`,
    `Projects: ${projects}`,
    `Education: ${education}`,
    `Certifications: ${certifications}`,
    `Additional: ${data.additional.linksText ?? ""}`
  ].join("\n");
}
