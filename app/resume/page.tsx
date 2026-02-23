import type { Metadata } from "next";
import { ExperienceTimeline } from "@/components/ExperienceTimeline";
import { SkillBadges } from "@/components/SkillBadges";
import { resume } from "@/lib/resume";

export const metadata: Metadata = {
  title: "Resume",
  description: "Experience, skills, education, and certifications for Tarun Raja.",
  openGraph: {
    title: "Tarun Raja Resume",
    description: "Professional experience and qualifications.",
    url: "/resume"
  }
};

export default function ResumePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <h1 className="text-3xl font-semibold tracking-tight">Resume</h1>
        <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300">{resume.profile.summary}</p>
        <a href="#" className="focus-ring mt-5 inline-block rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
          Download PDF (placeholder)
        </a>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Skills</h2>
        <SkillBadges groups={resume.skills.groups} />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Experience</h2>
        <ExperienceTimeline experience={resume.experience} />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="mb-4 text-xl font-semibold">Education</h2>
          <ul className="space-y-3 text-sm">
            {resume.education.map((item) => (
              <li key={`${item.school}-${item.year}`}>
                <p className="font-medium">{item.school}</p>
                <p>{item.degree}</p>
                <p className="text-zinc-500">
                  {item.year}
                  {item.details ? ` · ${item.details}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="mb-4 text-xl font-semibold">Certifications</h2>
          <ul className="space-y-2 text-sm">
            {resume.certifications.map((cert) => (
              <li key={`${cert.year}-${cert.name}`}>
                <span className="font-medium">{cert.year}:</span> {cert.name}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
