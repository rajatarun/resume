import { ExperienceTimeline } from "@/components/ExperienceTimeline";
import { SkillBadges } from "@/components/SkillBadges";
import { recordProof } from "@/lib/proof";
import { resume } from "@/lib/resume";

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

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold">Resume</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-300">{resume.profile.summary}</p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Skills</h2>
        <SkillBadges groups={resume.skills.groups} />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Experience</h2>
        <ExperienceTimeline experience={resume.experience} showProofLink />
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
