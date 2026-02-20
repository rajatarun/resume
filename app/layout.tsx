import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarun Raja | Chatbot Resume",
  description: "Recruiter-ready AI resume and JD match portal for Tarun Raja."
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/resume", label: "Resume" },
  { href: "/recruiter", label: "Recruiter" },
  { href: "/projects", label: "Projects" },
  { href: "/contact", label: "Contact" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between p-4">
            <Link href="/" className="text-lg font-semibold text-brand-700">Tarun Raja</Link>
            <ul className="flex gap-4 text-sm font-medium">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link className="hover:text-brand-700" href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
