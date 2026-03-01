import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { Section } from "@/components/Section";
import { StackGrid } from "@/components/website/StackGrid";
import { websiteArchitectureSections, websiteArchitectureStack } from "@/src/data/websiteArchitecture";

export const metadata: Metadata = {
  title: "Website Architecture",
  description: "Authoritative architecture document for the static website, serverless APIs, and AI workflow modules.",
  openGraph: {
    title: "Website Architecture",
    description: "System design, cloud services, data model, security, and roadmap for Tarun Raja's website.",
    url: "/website"
  }
};

export default function WebsitePage() {
  return (
    <PageShell
      title="Website Architecture"
      intro="This page is the canonical system design reference for the website, including static hosting, GitHub ingestion, admin workflows, AI modules, security posture, and deployment patterns."
    >
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Table of contents</p>
          <nav className="mt-3 space-y-2">
            {websiteArchitectureSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block text-sm text-slate-700 transition hover:text-sky-600 dark:text-slate-200 dark:hover:text-sky-400"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <div className="space-y-8">
          {websiteArchitectureSections.map((section) => (
            <article
              key={section.id}
              id={section.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <Section title={section.title}>
                <div className="space-y-4 text-sm leading-7 text-slate-700 dark:text-slate-200">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}

                  {section.bullets ? (
                    <ul className="list-disc space-y-1 pl-6">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}

                  {section.id === "aws-services" ? <StackGrid stack={websiteArchitectureStack} /> : null}

                  {section.diagram ? (
                    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{section.diagram.title}</p>
                      <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
                        <code>{`\`\`\`mermaid\n${section.diagram.mermaid}\n\`\`\``}</code>
                      </pre>
                    </div>
                  ) : null}
                </div>
              </Section>
            </article>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
