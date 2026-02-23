import type { Metadata } from "next";
import { Card } from "@/components/Card";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Tarun Raja is a full-stack engineering leader focused on production-grade software, cloud platforms, and GenAI experiences.",
  openGraph: {
    title: "Tarun Raja | Full-Stack Engineering Leader",
    description:
      "Building production-grade software, cloud platforms, and GenAI experiences.",
    url: "/"
  }
};

const highlights = [
  { label: "Platforms launched", value: "12+" },
  { label: "Years leading teams", value: "10+" },
  { label: "Mentored engineers", value: "50+" }
] as const;

const capabilities = [
  {
    title: "Backend",
    description: "Distributed APIs, event-driven systems, and reliability engineering for high-scale products."
  },
  {
    title: "Cloud",
    description: "Secure cloud architecture, platform foundations, CI/CD, and resilient operations at scale."
  },
  {
    title: "GenAI",
    description: "From proof of concept to production with practical guardrails, observability, and value tracking."
  }
] as const;

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12 dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-400">TARUN RAJA</p>
        <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight sm:text-5xl">
          Building production-grade software, cloud platforms, and GenAI experiences.
        </h1>
        <p className="mt-5 max-w-3xl text-base text-slate-600 sm:text-lg dark:text-slate-300">
          I’m Tarun Raja, a full-stack engineering leader known for shipping reliable systems, translating product vision into clean
          user experiences, and mentoring teams to deliver with clarity, quality, and long-term ownership.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/60">
              <p className="text-2xl font-semibold tracking-tight">{item.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">What I do</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {capabilities.map((item) => (
            <Card key={item.title}>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
