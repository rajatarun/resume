"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { Web3NavControls } from "@/components/web3/Web3NavControls";

type InternalHref = Route;
type ExternalHref = `http${"s" | ""}://${string}`;
type NavItem = { label: string } &
  (
    | { href: InternalHref; external?: false }
    | { href: ExternalHref; external: true }
  );
type NavGroup = { label: string; items: NavItem[] };

const primaryLinks: NavItem[] = [
  { href: "/" as Route, label: "Home" },
  { href: "/labs" as Route, label: "AI Lab" },
  { href: "/store" as Route, label: "Store" }
];

const dropdownGroups: NavGroup[] = [
  {
    label: "Work",
    items: [
      { href: "/resume" as Route, label: "Resume" },
      { href: "/portfolio" as Route, label: "Portfolio" },
      { href: "/website" as Route, label: "Website" },
      { href: "/projects" as Route, label: "Projects" }
    ]
  },
  {
    label: "Insights",
    items: [
      { href: "/blog" as Route, label: "Blog" },
      { href: "/newsletter" as Route, label: "Newsletter" }
    ]
  },
  {
    label: "Contact",
    items: [
      { href: "/contact" as Route, label: "Contact" },
      { href: "/recruiter" as Route, label: "Recruiter" },
      { href: "/appointment" as Route, label: "Appointment" }
    ]
  }
];

type NavLinkProps = {
  item: NavItem;
  className: string;
  onClick?: () => void;
};

function NavLink({ item, className, onClick }: NavLinkProps) {
  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer noopener"
        className={className}
        onClick={onClick}
      >
        {item.label}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className} onClick={onClick}>
      {item.label}
    </Link>
  );
}

function DesktopDropdown({ label, items }: NavGroup) {
  return (
    <details className="group relative">
      <summary className="focus-ring flex cursor-pointer list-none items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white">
        {label}
        <span aria-hidden="true" className="text-xs">
          ▾
        </span>
      </summary>
      <div className="absolute left-0 top-full z-50 mt-2 min-w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        {items.map((item) => (
          <NavLink
            key={`${item.label}-${item.href}`}
            item={item}
            className="focus-ring block rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          />
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
              <NavLink
                key={`${item.label}-${item.href}`}
                item={item}
                className="focus-ring rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
              />
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
          <nav
            aria-label="Mobile primary navigation"
            className="mt-3 space-y-3 border-t border-slate-200 pt-3 md:hidden dark:border-slate-800"
          >
            <div className="grid gap-2">
              {primaryLinks.map((item) => (
                <NavLink
                  key={`${item.label}-${item.href}`}
                  item={item}
                  className="focus-ring rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => setIsOpen(false)}
                />
              ))}
            </div>
            {dropdownGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {group.label}
                </p>
                {group.items.map((item) => (
                  <NavLink
                    key={`${item.label}-${item.href}`}
                    item={item}
                    className="focus-ring block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => setIsOpen(false)}
                  />
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
