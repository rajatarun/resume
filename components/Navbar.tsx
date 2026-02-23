import Link from "next/link";

const navLinks = [
  ["/", "Home"],
  ["/resume", "Resume"],
  ["/projects", "Projects"],
  ["/recruiter", "Recruiter"],
  ["/contact", "Contact"],
  ["/store", "Store"],
  ["/website", "Website"],
  ["/portfolio", "Portfolio"],
  ["/blog", "Blog"],
  ["/appointment", "Appointment"],
  ["/newsletter", "Newsletter"]
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="focus-ring shrink-0 text-lg font-semibold tracking-tight">
          Tarun Raja
        </Link>
        <nav aria-label="Primary navigation" className="flex flex-wrap justify-end gap-1">
          {navLinks.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="focus-ring rounded-md px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
