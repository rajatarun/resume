import type { Metadata } from "next";
import { Card } from "@/components/Card";
import { PageShell } from "@/components/PageShell";
import { doiUrl, formatPublicationDate, publications } from "@/data/publications";
import { routeMetadata } from "@/src/seo/seo.config";

export const metadata: Metadata = routeMetadata["/publications"];

export default function PublicationsPage() {
  return (
    <PageShell
      title="Publications"
      intro="Zenodo preprints by Tarun Raja. Each record below is a preprint, not a peer-reviewed article."
    >
      <ul className="space-y-4" aria-label="Publications">
        {publications.map((publication) => (
          <li key={publication.doi}>
            <Card>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
                <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                  {publication.status}
                </span>
                <span aria-hidden="true">·</span>
                <span>{publication.venue}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={publication.published}>{formatPublicationDate(publication.published)}</time>
              </p>
              <h2 className="mt-3 text-lg font-semibold leading-snug tracking-tight">{publication.title}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {publication.author.name}
                <span aria-hidden="true"> · </span>
                <a
                  href={publication.author.orcidUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring rounded-sm text-sky-700 underline decoration-sky-700/30 underline-offset-2 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
                >
                  ORCID {publication.author.orcid}
                </a>
              </p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
                <a
                  href={doiUrl(publication.doi)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring rounded-sm text-sky-700 underline decoration-sky-700/30 underline-offset-2 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
                >
                  DOI {publication.doi}
                </a>
                <a
                  href={publication.recordUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring rounded-sm text-sky-700 underline decoration-sky-700/30 underline-offset-2 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
                >
                  Zenodo record
                </a>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
