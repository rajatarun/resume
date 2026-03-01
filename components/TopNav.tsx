"use client";

import Link from "next/link";
import { useState } from "react";
import { Web3NavControls } from "@/components/web3/Web3NavControls";

type NavItem = { href: string; label: string };
type NavGroup = { label: string; items: NavItem[] };

const primaryLinks: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/labs", label: "AI Lab" },
  { href: "/store", label: "Store" }
];

const dropdownGroups: NavGroup[] = [
  {
    label: "Work",
    items: [
      { href: "/resume", label: "Resume" },
      { href: "/portfolio", label: "Portfolio" },
      { href: "/website", label: "Website" },
      { href: "/projects", label: "Projects" }
    ]
  },
  {
    label: "Insights",
    items: [
      { href: "/blog", label: "Blog" },
      { href: "/newsletter", label: "Newsletter" }
    ]
  },
  {
    label: "Contact",
    items: [
      { href: "/contact", label: "Contact" },
      { href: "/recruiter", label: "Recruiter" },
      { href: "/appointment", label: "Appointment" }
    ]
  }
];

function DesktopDropdown({ label, items }: NavGroup) {
  return (
    <details className="group relative">
      <summary className="focus-ring flex cursor-pointer list-none items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white">
        {label}
        <span aria-hidden="true" className="text-xs">▾</span>
      </summary>
      <div className="absolute left-0 top-full z-50 mt-2 min-w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="focus-ring block rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </details>
  );
}

export function TopNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="focus-ring text-lg font-semibold tracking-tight">
            Tarun Raja
          </Link>

          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((prev) => !prev)}
            className="focus-ring rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 md:hidden dark:border-slate-700 dark:text-slate-200"
          >
            Menu
          </button>

          <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">
            {primaryLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            {dropdownGroups.map((group) => (
              <DesktopDropdown key={group.label} {...group} />
            ))}
          </nav>
          <div className="hidden md:block">
            <Web3NavControls />
          </div>
        </div>

        {isOpen && (
          <nav aria-label="Mobile primary navigation" className="mt-3 space-y-3 border-t border-slate-200 pt-3 md:hidden dark:border-slate-800">
            <div className="grid gap-2">
              {primaryLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="focus-ring rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            {dropdownGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{group.label}</p>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="focus-ring block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
            <div className="pt-1">
              <Web3NavControls />
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
