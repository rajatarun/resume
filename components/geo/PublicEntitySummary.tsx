import Link from "next/link";
import { publicEntity } from "@/lib/geo/publicEntity";

/**
 * Crawlable, user-visible professional summary on the home page (not design-variant-specific).
 */
export function PublicEntitySummary() {
  return (
    <section
      aria-labelledby="public-entity-summary-heading"
      className="mb-6 rounded-2xl border border-slate-200 bg-white/90 p-5 text-sm leading-relaxed text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200"
    >
      <h1 id="public-entity-summary-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-50">
        {publicEntity.siteTitle}
      </h1>
      <p className="mt-2">{publicEntity.profileSummary}</p>
      <p className="mt-3 text-slate-600 dark:text-slate-300">
        Location: {publicEntity.locationLabel}. Current role: {publicEntity.currentTitle} at{" "}
        {publicEntity.currentEmployer}.
      </p>
      <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium" aria-label="Primary professional pages">
        <Link href="/resume" className="focus-ring text-sky-700 underline decoration-sky-300 underline-offset-2 dark:text-sky-300">
          Full résumé
        </Link>
        <Link
          href="/publications"
          className="focus-ring text-sky-700 underline decoration-sky-300 underline-offset-2 dark:text-sky-300"
        >
          Zenodo preprints
        </Link>
        <Link
          href="/portfolio"
          className="focus-ring text-sky-700 underline decoration-sky-300 underline-offset-2 dark:text-sky-300"
        >
          GitHub portfolio
        </Link>
        <a
          href={publicEntity.orcidUrl}
          className="focus-ring text-sky-700 underline decoration-sky-300 underline-offset-2 dark:text-sky-300"
          target="_blank"
          rel="noopener noreferrer"
        >
          ORCID {publicEntity.orcid}
        </a>
      </nav>
    </section>
  );
}
