import type { Metadata } from "next";
import { Card } from "@/components/Card";
import { NewsletterSubscribeForm } from "@/components/NewsletterSubscribeForm";
import { PageShell } from "@/components/PageShell";
import { Section } from "@/components/Section";
import { newsletterIssues } from "@/data/newsletter-issues";

export const metadata: Metadata = {
  title: "Newsletter",
  description: "Subscribe to Tarun Raja's newsletter and browse past issues.",
  openGraph: {
    title: "Tarun Raja Newsletter",
    description: "Subscribe for engineering leadership, cloud, and GenAI insights.",
    url: "/newsletter"
  }
};

export default function NewsletterPage() {
  return (
    <PageShell title="Newsletter" intro="A concise newsletter on full-stack leadership, cloud architecture, and practical GenAI implementation.">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <Section title="Subscribe">
            <NewsletterSubscribeForm />
            <a href="/rss.xml" className="focus-ring mt-3 inline-block text-sm text-sky-600 underline">RSS feed (optional)</a>
          </Section>
        </Card>

        <Card>
          <Section title="Past issues">
            <ul className="space-y-3">
              {newsletterIssues.map((issue) => (
                <li key={issue.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-xs text-slate-500">{issue.date}</p>
                  <h3 className="font-medium">{issue.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{issue.summary}</p>
                </li>
              ))}
            </ul>
          </Section>
        </Card>
      </div>
    </PageShell>
  );
}
