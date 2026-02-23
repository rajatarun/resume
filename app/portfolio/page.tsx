import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { Section } from "@/components/Section";
import { PortfolioFilters } from "@/components/PortfolioFilters";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Project portfolio of Tarun Raja across backend, frontend, cloud, and GenAI initiatives.",
  openGraph: {
    title: "Tarun Raja Portfolio",
    description: "Impact-focused project highlights with stacks and outcomes.",
    url: "/portfolio"
  }
};

export default function PortfolioPage() {
  return (
    <PageShell title="Portfolio" intro="A curated snapshot of work spanning backend modernization, frontend delivery, cloud platforms, and GenAI adoption.">
      <Section title="Projects" description="Filter by focus area to explore how I approach architecture, delivery, and measurable impact.">
        <PortfolioFilters />
      </Section>
    </PageShell>
  );
}
