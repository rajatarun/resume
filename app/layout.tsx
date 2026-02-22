import "./globals.css";
import Link from "next/link";
import type { Metadata, Route } from "next";
import { resume } from "@/lib/resume";
import { ThemeToggle } from "@/components/ThemeToggle";

const summary = resume.profile.summary;

export const metadata: Metadata = {
  title: `${resume.header.name} | Resume Website`,
  description: summary
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/resume", label: "Resume" },
  { href: "/projects", label: "Projects" },
  { href: "/recruiter", label: "Recruiter" },
  { href: "/contact", label: "Contact" }
] satisfies ReadonlyArray<{ href: Route; label: string }>;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
        <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold">{resume.header.name}</Link>
            <div className="flex items-center gap-3">
              <ul className="hidden gap-4 text-sm md:flex">
                {navItems.map((item) => (
                  <li key={item.href}><Link href={item.href}>{item.label}</Link></li>
                ))}
              </ul>
              <ThemeToggle />
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
