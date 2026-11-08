import { publicationAuthor } from "@/data/publications";
import { getHeadline, resume } from "@/lib/resume";

const currentRole = resume.experience[0];

/** Facts derived only from published résumé + publication catalogue on the public site. */
export const publicEntity = {
  name: "Tarun Raja",
  legalHeaderName: resume.header.name,
  currentTitle: currentRole?.title ?? "Senior Lead Software Engineer",
  currentEmployer: currentRole?.company ?? "JP MORGAN CHASE",
  locationLabel: resume.header.location,
  profileSummary: resume.profile.summary,
  profileHeadline: getHeadline(resume.profile.summary),
  orcid: publicationAuthor.orcid,
  orcidUrl: publicationAuthor.orcidUrl,
  siteTitle: `Tarun Raja — ${currentRole?.title ?? "Senior Lead Software Engineer"}`,
  siteTagline:
    "Public professional site for Tarun Raja: résumé, portfolio, Zenodo preprints, and engineering writing."
} as const;

export function parseUsLocation(label: string): {
  addressLocality: string;
  addressRegion: string;
  addressCountry: string;
} {
  const parts = label.split(",").map((p) => p.trim());
  if (parts.length >= 3) {
    return {
      addressLocality: parts[0] ?? label,
      addressRegion: parts[1] ?? "",
      addressCountry: parts[2] === "United States" ? "US" : parts[2] ?? "US"
    };
  }
  return { addressLocality: label, addressRegion: "TX", addressCountry: "US" };
}

export function knowsAboutFromResume(): string[] {
  const fromSkills = resume.skills.groups.flatMap((g) => g.items);
  const fromExperience = resume.experience.flatMap((e) => [e.title, e.company]);
  const unique = new Set(
    [...fromSkills, ...fromExperience, "Fintech", "Software Architecture"].map((s) => s.trim()).filter(Boolean)
  );
  return [...unique].sort((a, b) => a.localeCompare(b));
}

export function alumniOfFromResume() {
  return resume.education.map((edu) => ({
    "@type": "CollegeOrUniversity" as const,
    name: edu.school,
    ...(edu.degree ? { description: `${edu.degree} (${edu.year})` } : {})
  }));
}

export function credentialsFromResume() {
  return resume.certifications.map((cert) => ({
    "@type": "EducationalOccupationalCredential" as const,
    name: cert.name,
    dateCreated: cert.year
  }));
}
