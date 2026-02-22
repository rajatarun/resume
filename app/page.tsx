import Link from "next/link";
import { getHeadline, resume } from "@/lib/resume";

const proofTiles = ["10+ years fintech", "JPMorgan Chase leadership", "Kanban-led global teams", "Cloud + Kubernetes delivery", "AI enablement initiatives"];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-zinc-200 p-8 dark:border-zinc-800">
        <p className="text-sm uppercase tracking-wide text-zinc-500">Senior Lead Software Engineer</p>
        <h1 className="mt-2 text-4xl font-semibold">{resume.header.name}</h1>
        <p className="mt-4 max-w-3xl text-zinc-600 dark:text-zinc-300">{getHeadline(resume.profile.summary)}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/resume" className="rounded-lg bg-blue-600 px-4 py-2 text-white">Download Resume</a>
          <Link href="/recruiter" className="rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700">Recruiter Chat</Link>
          <Link href="/contact" className="rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700">Contact</Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {proofTiles.map((tile) => (
          <article key={tile} className="rounded-2xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">{tile}</article>
        ))}
      </section>
    </div>
  );
}
