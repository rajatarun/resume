"use client";

import { useState } from "react";
import { Card } from "@/components/Card";
import { PageShell } from "@/components/PageShell";
import { tutorialTopics, type Tutorial, type TutorialTopic } from "@/data/tutorials";
import { claudeWorkshops, type Workshop } from "@/data/workshops";

const levelStyles: Record<Tutorial["level"], string> = {
  Beginner:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  Intermediate:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Advanced:
    "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
};

const stats = [
  { value: "10+", label: "Years engineering" },
  { value: "3+", label: "Years in AI/LLM" },
  { value: "3", label: "Technical leads mentored" },
  { value: "6", label: "Cloud AI curriculum modules" },
];

function TutorialCard({ tutorial }: { tutorial: Tutorial }) {
  return (
    <Card className="flex flex-col">
      <span
        className={`inline-block self-start rounded-full px-2.5 py-0.5 text-xs font-medium ${levelStyles[tutorial.level]}`}
      >
        {tutorial.level}
      </span>
      <h3 className="mt-3 text-base font-semibold leading-snug">
        {tutorial.title}
      </h3>
      <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-300">
        {tutorial.description}
      </p>
      <a
        href={tutorial.pdfUrl}
        download={tutorial.downloadName}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-ring mt-4 inline-flex items-center gap-1.5 rounded-lg border border-sky-600 px-3.5 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50 active:bg-sky-100 dark:hover:bg-sky-950/40 dark:active:bg-sky-950/60"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v11"
          />
        </svg>
        Download guide
      </a>
    </Card>
  );
}

function WorkshopCard({ workshop }: { workshop: Workshop }) {
  return (
    <Card className="flex flex-col">
      <span className="inline-block self-start rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
        Workshop {workshop.id}
      </span>
      <h3 className="mt-3 text-base font-semibold leading-snug">{workshop.title}</h3>
      <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-300">
        {workshop.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={workshop.tutorial}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-violet-600 px-3.5 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 active:bg-violet-100 dark:hover:bg-violet-950/40 dark:active:bg-violet-950/60"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v11"
            />
          </svg>
          Tutorial
        </a>
        <a
          href={workshop.questions}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-slate-400 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:active:bg-slate-700"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Questions
        </a>
      </div>
    </Card>
  );
}

function ClaudeWorkshopsAccordion() {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="focus-ring flex w-full items-center justify-between rounded-2xl p-5 text-left"
      >
        <div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">{claudeWorkshops.name}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {claudeWorkshops.workshops.length} workshops
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {claudeWorkshops.description}
          </p>
        </div>
        <svg
          aria-hidden="true"
          className={`ml-4 h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-5 pt-4 dark:border-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Download the index for a full overview of all six workshops.
            </p>
            <a
              href={claudeWorkshops.index}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-violet-700 active:bg-violet-800"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v11"
                />
              </svg>
              Workshop Index
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {claudeWorkshops.workshops.map((workshop) => (
              <WorkshopCard key={workshop.id} workshop={workshop} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TopicAccordion({
  topic,
  defaultOpen,
}: {
  topic: TutorialTopic;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="focus-ring flex w-full items-center justify-between rounded-2xl p-5 text-left"
      >
        <div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">{topic.topic}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {topic.tutorials.length} modules
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {topic.description}
          </p>
        </div>
        <svg
          aria-hidden="true"
          className={`ml-4 h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-5 pt-4 dark:border-slate-800">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topic.tutorials.map((tutorial) => (
              <TutorialCard key={tutorial.id} tutorial={tutorial} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StorePage() {
  return (
    <PageShell
      title="Workshops"
      intro="I coach engineering teams from first API call to production-grade AI systems. Each module below reflects a topic I teach hands-on — grab the companion guide or reach out to run a session with your team."
    >
      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-2xl font-bold text-sky-600">{s.value}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Claude CCA Workshops */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-widest text-slate-400">
          Claude Certified Associate
        </h2>
        <ClaudeWorkshopsAccordion />
      </div>

      {/* Curriculum */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-widest text-slate-400">
          Curriculum
        </h2>
        {tutorialTopics.map((topic, i) => (
          <TopicAccordion key={topic.topic} topic={topic} defaultOpen={i === 0} />
        ))}
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-6 dark:border-sky-800/50 dark:bg-sky-950/20">
        <h2 className="text-base font-semibold text-sky-900 dark:text-sky-200">
          Run a session with your team
        </h2>
        <p className="mt-1 text-sm text-sky-800 dark:text-sky-300">
          I work with engineering teams to build intuition for Cloud AI — from architecture decisions to hands-on implementation. If you want to level up your team on any of these topics, get in touch.
        </p>
        <a
          href="mailto:rajatarun12@gmail.com"
          className="focus-ring mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 active:bg-sky-800"
        >
          Get in touch
        </a>
      </div>
    </PageShell>
  );
}
