import "./globals.css";
import type { Metadata, Route } from "next";
import { resume } from "@/lib/resume";
import { SiteHeader } from "@/components/SiteHeader";

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
        <SiteHeader name={resume.header.name} navItems={navItems} />
        <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
