import { resumeData } from "@/lib/data/resume";

export default function ResumePage() {
  return (
    <div className="space-y-6">
      <section className="prose-card">
        <h1 className="text-2xl font-bold">Resume</h1>
        <p className="text-slate-600">All sections are rendered from <code>lib/data/resume.json</code>.</p>
      </section>

      <section className="prose-card">
        <h2 className="mb-3 text-xl font-semibold">Experience</h2>
        <div className="space-y-4">
          {resumeData.experience.map((exp) => (
            <article key={`${exp.company}-${exp.role}`}>
              <h3 className="font-semibold">{exp.role} · {exp.company}</h3>
              <p className="text-sm text-slate-500">{exp.years}</p>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {exp.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="prose-card">
          <h2 className="mb-3 text-xl font-semibold">Skills</h2>
          {resumeData.skills.map((skill) => (
            <p key={skill.group}><span className="font-semibold">{skill.group}:</span> {skill.items.join(", ")}</p>
          ))}
        </article>
        <article className="prose-card">
          <h2 className="mb-3 text-xl font-semibold">Certifications</h2>
          <ul className="list-disc pl-5">
            {resumeData.certifications.map((cert) => <li key={cert}>{cert}</li>)}
          </ul>
        </article>
      </section>
    </div>
  );
}
