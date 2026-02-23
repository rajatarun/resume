import type { Metadata } from "next";
import Link from "next/link";
import { PillLink } from "@/components/PillLink";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Home",
  description: "Tarun Raja's personal website: store, portfolio, blog, appointment booking, and newsletter.",
  openGraph: {
    title: "Tarun Raja | Professional Personal Website",
    description: "Explore Tarun Raja's store, website details, portfolio, blog, appointments, and newsletter.",
    url: "/"
  }
};

const links = [
  { href: "/store", label: "Visit my store" },
  { href: "/website", label: "Visit my website", highlight: true },
  { href: "/portfolio", label: "View my portfolio" },
  { href: "/blog", label: "View my blog" },
  { href: "/appointment", label: "Book an appointment" },
  { href: "/newsletter", label: "View my newsletter" }
] as const;

const legacyLinks = [
  { href: "/resume", label: "Read my resume" },
  { href: "/projects", label: "Explore projects archive" },
  { href: "/recruiter", label: "Open recruiter panel" },
  { href: "/contact", label: "Contact Tarun" }
] as const;

export default function HomePage() {
  return (
    <PageShell
      title="AI Systems Architect & Social-Media Technologist"
      intro="I’m Tarun Raja, focused on trust-aware AI systems, observability-driven platform delivery, and career mentoring for engineers growing into architecture and leadership roles."
    >
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">AI Systems Lab</h2>
        <Link
          href="/lab"
          className="focus-ring inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700"
        >
          Enter AI Systems Lab
        </Link>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Explore new deep-link sections</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {links.map((item) => (
            <PillLink key={item.href} href={item.href} label={item.label} highlight={"highlight" in item && item.highlight} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Legacy sections</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {legacyLinks.map((item) => (
            <PillLink key={item.href} href={item.href} label={item.label} />
          ))}
        </div>
      </section>
    </PageShell>
  );
}
