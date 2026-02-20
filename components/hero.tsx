"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { resumeData } from "@/lib/data/resume";

export function Hero() {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="prose-card">
      <p className="text-sm uppercase tracking-wide text-brand-700">Recruiter-ready profile</p>
      <h1 className="mt-2 text-3xl font-bold">{resumeData.profile.name}</h1>
      <p className="text-lg text-slate-600">{resumeData.profile.title}</p>
      <p className="mt-4 text-slate-700">{resumeData.profile.summary}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link className="rounded-lg bg-brand-500 px-4 py-2 text-white" href="/recruiter">Recruiter Chat</Link>
        <Link className="rounded-lg border border-slate-300 px-4 py-2" href="/resume">View Resume</Link>
      </div>
    </motion.section>
  );
}
