import type { Metadata } from "next";
import { Card } from "@/components/Card";
import { NewsletterSubscribeForm } from "@/components/NewsletterSubscribeForm";
import { PageShell } from "@/components/PageShell";
import { Section } from "@/components/Section";
import { NewsletterPastIssues } from "@/components/NewsletterPastIssues";

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
            <NewsletterPastIssues />
          </Section>
        </Card>
      </div>
    </PageShell>
  );
}
