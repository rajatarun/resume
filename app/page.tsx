import { Hero } from "@/components/hero";
import { resumeData } from "@/lib/data/resume";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <Hero />
      <section className="grid gap-4 md:grid-cols-3">
        <article className="prose-card"><p className="text-sm text-slate-500">Years Experience</p><p className="text-2xl font-bold">6+</p></article>
        <article className="prose-card"><p className="text-sm text-slate-500">Core Stack</p><p className="text-2xl font-bold">Next.js + AWS + AI</p></article>
        <article className="prose-card"><p className="text-sm text-slate-500">Current Role</p><p className="text-lg font-bold">{resumeData.experience[0]?.role}</p></article>
      </section>
    </div>
  );
}
