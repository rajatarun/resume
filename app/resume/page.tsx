import type { Metadata } from "next";
import { ExperienceTimeline } from "@/components/ExperienceTimeline";
import { SkillBadges } from "@/components/SkillBadges";
import { SkillDepthChart } from "@/components/SkillDepthChart";
import { experienceArtifactKeys } from "@/lib/artifacts";
import { recordProof } from "@/lib/proof";
import { doiUrl, formatPublicationDate, publicationAuthor, publications } from "@/data/publications";
import { resume } from "@/lib/resume";
import { ResumeGeoStructuredData } from "@/src/components/ResumeGeoStructuredData";
import { aiweaveUrl, orcidProfileUrl, routeMetadata } from "@/src/seo/seo.config";

export const metadata: Metadata = routeMetadata["/resume"];

export default async function ResumePage() {
  await Promise.all(
    resume.experience.map((item) =>
      recordProof({
        id: `${item.company}-${item.title}-${item.startYear}`,
        title: `${item.title} @ ${item.company}`,
        summary: item.highlights.map((highlight) => `${highlight.label}: ${highlight.text}`).join(" | "),
        url: "/resume",
        contentHash: `sha256('${item.title}')`
      })
    )
  );

  const experienceWithArtifacts = resume.experience.map((item, index) => ({
    ...item,
    artifactKey: experienceArtifactKeys[index]
  }));

  return (
    <div className="space-y-8">
      <ResumeGeoStructuredData />
      <section>
        <h1 className="text-3xl font-semibold">Tarun Raja — Resume</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-300">{resume.profile.summary}</p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Skills</h2>
        <SkillDepthChart groups={resume.skills.groups} />
        <div className="mt-6">
          <SkillBadges groups={resume.skills.groups} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Experience</h2>
        <ExperienceTimeline experience={experienceWithArtifacts} showProofLink />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Projects</h2>
        <ul className="space-y-6">
          {resume.projects.map((project) => (
            <li key={project.name} className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
              <h3 className="text-lg font-semibold">
                {project.name}
                {project.name === "AIWeave" ? (
                  <>
                    {" "}
                    —{" "}
                    <a href={aiweaveUrl} className="focus-ring text-sky-700 underline dark:text-sky-400" target="_blank" rel="noopener noreferrer">
                      aiweave.org
                    </a>
                  </>
                ) : null}
              </h3>
              {project.subtitle ? <p className="mt-1 text-sm text-zinc-500">{project.subtitle}</p> : null}
              <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                {project.highlights.map((highlight) => (
                  <li key={highlight.label}>
                    <span className="font-medium">{highlight.label}:</span> {highlight.text}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Publications</h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Zenodo preprints (not peer-reviewed).{" "}
          <a href={orcidProfileUrl} className="focus-ring text-sky-700 underline dark:text-sky-400" target="_blank" rel="noopener noreferrer">
            ORCID {publicationAuthor.orcid}
          </a>
        </p>
        <ul className="space-y-4 text-sm">
          {publications.map((publication) => (
            <li key={publication.doi} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="font-medium">{publication.title}</p>
              <p className="mt-1 text-zinc-500">
                {publication.status} on {publication.venue} · {formatPublicationDate(publication.published)}
              </p>
              <a href={doiUrl(publication.doi)} className="focus-ring mt-2 inline-block text-sky-700 underline dark:text-sky-400" target="_blank" rel="noopener noreferrer">
                doi:{publication.doi}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="mb-4 text-xl font-semibold">Education</h2>
          <ul className="space-y-3 text-sm">
            {resume.education.map((item) => (
              <li key={`${item.school}-${item.year}`}>
                <p className="font-medium">{item.school}</p>
                <p>{item.degree}</p>
                <p className="text-zinc-500">{item.year}{item.details ? ` · ${item.details}` : ""}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="mb-4 text-xl font-semibold">Certifications</h2>
          <ul className="space-y-2 text-sm">
            {resume.certifications.map((cert) => (
              <li key={`${cert.year}-${cert.name}`}><span className="font-medium">{cert.year}:</span> {cert.name}</li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
