import Link from "next/link";
import { Web3NavControls } from "@/components/web3/Web3NavControls";

const navLinks = [
  ["/", "Home"],
  ["/resume", "Resume"],
  ["/projects", "Projects"],
  ["/recruiter", "Recruiter"],
  ["/contact", "Contact"],
  ["/store", "Store"],
  ["/website", "Website"],
  ["/labs", "AI Lab"],
  ["/portfolio", "Portfolio"],
  ["/blog", "Blog"],
  ["/appointment", "Appointment"],
  ["/newsletter", "Newsletter"]
] as const;

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="focus-ring text-lg font-semibold tracking-tight">Tarun Raja</Link>
          <Web3NavControls />
        </div>
        <nav aria-label="Primary navigation" className="flex gap-1 overflow-x-auto pb-1">
          {navLinks.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="focus-ring whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
