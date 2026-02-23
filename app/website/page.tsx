import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/Card";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { PageShell } from "@/components/PageShell";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Website",
  description: "Learn about Tarun Raja's website architecture, tech stack, and contact points.",
  openGraph: {
    title: "About Tarun Raja's Website",
    description: "How this site is structured, built, and maintained.",
    url: "/website"
  }
};

export default function WebsitePage() {
  return (
    <PageShell title="Website" intro="This website is built as a clean, deploy-friendly experience for showcasing work, publishing ideas, and connecting with peers and teams.">
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <Section title="About this website">
            <p className="text-sm text-slate-600 dark:text-slate-300">Designed for clarity and speed, the site focuses on deep-link pages with practical content instead of modal interactions.</p>
          </Section>
        </Card>
        <Card>
          <Section title="Tech stack">
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
              <li>Next.js App Router + TypeScript</li>
              <li>TailwindCSS for modern UI consistency</li>
              <li>SEO metadata + sitemap + robots</li>
            </ul>
          </Section>
        </Card>
        <Card>
          <Section title="Contact">
            <p className="text-sm text-slate-600 dark:text-slate-300">For collaborations, architecture consulting, or mentoring: hello@tarunraja.dev</p>
          </Section>
        </Card>
        <Card>
          <Section title="Quick links">
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/portfolio" className="focus-ring text-sky-600">Portfolio</Link>
              <Link href="/blog" className="focus-ring text-sky-600">Blog</Link>
              <Link href="/appointment" className="focus-ring text-sky-600">Book appointment</Link>
            </div>
          </Section>
          <div className="mt-4">
            <CopyLinkButton url="https://tarunraja.dev/website" />
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
