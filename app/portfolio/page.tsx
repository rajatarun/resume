import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { Section } from "@/components/Section";
import { PortfolioFilters } from "@/components/PortfolioFilters";
import { routeMetadata } from "@/src/seo/seo.config";

export const metadata: Metadata = routeMetadata["/portfolio"];

export default function PortfolioPage() {
  return (
    <PageShell title="Tarun Raja — Portfolio" intro="A curated snapshot of work spanning backend modernization, frontend delivery, cloud platforms, and GenAI adoption.">
      <Section title="Projects" description="Filter by focus area to explore how I approach architecture, delivery, and measurable impact.">
        <PortfolioFilters />
      </Section>
    </PageShell>
  );
}
