export type ResumeArtifactKey =
  | "jpmc-senior-lead"
  | "jpmc-vp-lead"
  | "jpmc-application-dev"
  | "sonicsoft-frontend-dev";

export type ResumeArtifact = {
  key: ResumeArtifactKey;
  title: string;
  publicProofUrl: string;
};

export const resumeArtifacts: ResumeArtifact[] = [
  {
    key: "jpmc-senior-lead",
    title: "Senior Lead Software Engineer",
    publicProofUrl: "/blog/ai-systems-architect-2026-02-01"
  },
  {
    key: "jpmc-vp-lead",
    title: "Vice President / Software Engineering Lead",
    publicProofUrl: "/projects"
  },
  {
    key: "jpmc-application-dev",
    title: "Application Developer",
    publicProofUrl: "/portfolio"
  },
  {
    key: "sonicsoft-frontend-dev",
    title: "Front End Developer",
    publicProofUrl: "/website"
  }
];

export const experienceArtifactKeys: ResumeArtifactKey[] = [
  "jpmc-senior-lead",
  "jpmc-vp-lead",
  "jpmc-application-dev",
  "sonicsoft-frontend-dev"
];

export const artifactsByKey: Record<ResumeArtifactKey, ResumeArtifact> = resumeArtifacts.reduce(
  (acc, artifact) => ({ ...acc, [artifact.key]: artifact }),
  {} as Record<ResumeArtifactKey, ResumeArtifact>
);
