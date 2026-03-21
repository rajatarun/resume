"use client";

import { useState } from "react";
import { Card } from "@/components/Card";
import { PageShell } from "@/components/PageShell";
import { tutorialTopics, type Tutorial, type TutorialTopic } from "@/data/tutorials";

const levelStyles: Record<Tutorial["level"], string> = {
  Beginner:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  Intermediate:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Advanced:
    "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
};

function TutorialCard({ tutorial }: { tutorial: Tutorial }) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${levelStyles[tutorial.level]}`}
        >
          {tutorial.level}
        </span>
      </div>
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
        className="focus-ring mt-4 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-sky-700 active:bg-sky-800"
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
        Download PDF
      </a>
    </Card>
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
              {topic.tutorials.length} guides
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
      title="PDF Hub"
      intro="Downloadable guides and cheat sheets on AI, cloud architecture, and engineering. Free — no sign-up required."
    >
      <div className="space-y-4">
        {tutorialTopics.map((topic, i) => (
          <TopicAccordion key={topic.topic} topic={topic} defaultOpen={i === 0} />
        ))}
      </div>
    </PageShell>
  );
}
