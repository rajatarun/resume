import Link from "next/link";
import type { ExperienceItem } from "@/lib/resume";

type ExperienceTimelineProps = {
  experience: ExperienceItem[];
  showProofLink?: boolean;
};

export function ExperienceTimeline({ experience, showProofLink = false }: ExperienceTimelineProps) {
  return (
    <div className="space-y-6">
      {experience.map((item) => (
        <article key={`${item.company}-${item.title}-${item.startYear}`} className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-semibold">{item.title} · {item.company}</h3>
            <p className="text-sm text-zinc-500">{item.startYear} — {item.endYearOrPresent}</p>
          </div>
          {showProofLink ? (
            <Link href="/proof" className="mt-1 inline-flex text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300">
              🔗 Verify on-chain (coming soon)
            </Link>
          ) : null}
          {item.location && <p className="mt-1 text-sm text-zinc-500">{item.location}</p>}
          <ul className="mt-3 space-y-2">
            {item.highlights.map((highlight) => (
              <li key={`${item.title}-${highlight.label}`} className="text-sm leading-6">
                <span className="font-medium">{highlight.label}:</span> {highlight.text}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
