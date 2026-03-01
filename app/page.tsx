import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Mentorship and architecture guidance from Tarun Raja for trust-aware AI systems, observability-driven platforms, and engineering leadership growth.",
  openGraph: {
    title: "Tarun Raja | Mentoring Engineers into Architecture Leaders",
    description:
      "Learn how Tarun Raja helps engineers build reliable AI systems, deliver resilient platforms, and grow into trusted leaders.",
    url: "/"
  }
};

const expertise = [
  {
    title: "Trust-Aware AI",
    description: "Design practical AI systems with governance, safety, and performance built in from day one."
  },
  {
    title: "Observability Platforms",
    description: "Build production-ready platform foundations with measurable reliability and clear incident intelligence."
  },
  {
    title: "Career Mentoring",
    description: "Coach engineers to communicate architecture decisions, influence teams, and lead with confidence."
  }
] as const;

const outcomes = [
  { metric: "12+", label: "Years architecting cloud and AI products" },
  { metric: "200+", label: "Engineers and leaders mentored" },
  { metric: "30%", label: "Average delivery acceleration in guided teams" }
] as const;

const testimonials = [
  {
    quote:
      "Tarun helped me shift from implementation mode to architecture thinking. I now lead technical strategy with far more clarity.",
    name: "Priya N.",
    role: "Senior Software Engineer"
  },
  {
    quote:
      "Our platform reliability transformed after applying Tarun's observability coaching. Incident response became proactive, not reactive.",
    name: "Marcus L.",
    role: "Platform Engineering Manager"
  },
  {
    quote: "His mentoring gave me the confidence to drive AI roadmap decisions and align cross-functional teams around trust and outcomes.",
    name: "Alisha R.",
    role: "AI Product Lead"
  }
] as const;

function ExpertiseSnapshot() {
  return (
    <section className="mx-auto mt-20 max-w-6xl" aria-labelledby="expertise-heading">
      <h2 id="expertise-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Expertise Snapshot
      </h2>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {expertise.map((item) => (
          <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
              ✦
            </div>
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FeaturedOutcomes() {
  return (
    <section className="mx-auto mt-20 max-w-6xl" aria-labelledby="outcomes-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="outcomes-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Featured Work &amp; Outcomes
        </h2>
        <Link href="/portfolio" className="focus-ring text-sm font-semibold text-sky-700 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200">
          View full portfolio →
        </Link>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {outcomes.map((item) => (
          <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-3xl font-bold text-sky-700 dark:text-sky-300">{item.metric}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.label}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="mx-auto mt-20 max-w-6xl" aria-labelledby="testimonials-heading">
      <h2 id="testimonials-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Testimonials
      </h2>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {testimonials.map((item) => (
          <figure key={item.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <blockquote className="text-sm leading-6 text-slate-700 dark:text-slate-200">“{item.quote}”</blockquote>
            <figcaption className="mt-4 text-sm font-medium">
              <span className="block">{item.name}</span>
              <span className="text-slate-500 dark:text-slate-400">{item.role}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="mx-auto mt-20 max-w-4xl rounded-3xl border border-slate-200 bg-gradient-to-r from-sky-100 to-indigo-100 p-8 text-center dark:border-slate-700 dark:from-sky-900/30 dark:to-indigo-900/30">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ready to accelerate your architecture leadership journey?</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-700 dark:text-slate-200">
        Book a 1:1 mentoring session to build a roadmap for reliable AI systems, resilient platforms, and career growth.
      </p>
      <Link
        href="/appointment"
        className="focus-ring mt-6 inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
      >
        Book mentoring
      </Link>
    </section>
  );
}

function HomeFooter() {
  return (
    <footer className="mx-auto mt-20 max-w-6xl border-t border-slate-200 py-8 text-sm dark:border-slate-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-slate-600 dark:text-slate-300">© {new Date().getFullYear()} Tarun Raja. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/contact" className="focus-ring text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
            Contact
          </Link>
          <Link href="/newsletter" className="focus-ring text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
            Newsletter
          </Link>
          <Link href="mailto:hello@tarunraja.dev" className="focus-ring rounded-lg bg-slate-900 px-3 py-2 font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
            Get in touch
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <>
      <header className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 px-6 py-16 text-white sm:px-10 lg:px-14 lg:py-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.22),_transparent_50%),radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.18),_transparent_45%)]" />
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="text-center lg:text-left">
            <p className="inline-flex rounded-full border border-white/20 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
              Mentorship · AI Architecture · Platform Reliability
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Mentoring engineers to become architecture leaders through trust-aware AI and observability-driven platforms.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-200 lg:mx-0">
              I help engineers and teams build reliable AI systems, deliver resilient platforms, and grow into trusted technical leaders through practical mentorship and execution playbooks.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/appointment"
                className="focus-ring inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-900/30 transition hover:bg-sky-400 sm:w-auto"
              >
                Book mentoring
              </Link>
              <Link
                href="/labs"
                className="focus-ring inline-flex w-full items-center justify-center rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/20 sm:w-auto"
              >
                Explore AI Lab
              </Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-sm">
            <Image
              src="/profile-photo.PNG"
              alt="Tarun Raja portrait"
              width={520}
              height={620}
              priority
              className="h-auto w-full rounded-3xl border border-white/10 object-cover shadow-2xl"
            />
          </div>
        </div>
      </header>

      <ExpertiseSnapshot />
      <FeaturedOutcomes />
      <Testimonials />
      <FinalCTA />
      <HomeFooter />
    </>
  );
}
