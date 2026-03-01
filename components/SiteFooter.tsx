import Link from "next/link";
import { githubUrl, linkedInUrl } from "@/src/seo/seo.config";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white/80 py-8 dark:border-slate-800 dark:bg-slate-950/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-3 px-4 text-sm text-slate-500 sm:px-6 md:flex-row lg:px-8">
        <p>© {new Date().getFullYear()} Tarun Raja. Building practical cloud &amp; GenAI systems.</p>
        <div className="flex flex-wrap items-center gap-4">
          <a href={githubUrl} className="focus-ring text-sky-600 hover:text-sky-700 dark:text-sky-400" target="_blank" rel="noopener noreferrer">
            GitHub – Tarun Raja
          </a>
          <a href={linkedInUrl} className="focus-ring text-sky-600 hover:text-sky-700 dark:text-sky-400" target="_blank" rel="noopener noreferrer">
            LinkedIn – Tarun Raja
          </a>
          <Link href="/appointment" className="focus-ring text-sky-600 hover:text-sky-700 dark:text-sky-400">
            Book a mentoring session
          </Link>
        </div>
      </div>
    </footer>
  );
}
