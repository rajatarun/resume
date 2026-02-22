"use client";

import Link from "next/link";
import { useState } from "react";
import type { Route } from "next";
import { ThemeToggle } from "@/components/ThemeToggle";

export type NavItem = { href: Route; label: string };

export function SiteHeader({ name, navItems }: { name: string; navItems: ReadonlyArray<NavItem> }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
      <nav className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-semibold">{name}</Link>
          <div className="flex items-center gap-3">
            <ul className="hidden gap-4 text-sm md:flex">
              {navItems.map((item) => (
                <li key={item.href}><Link href={item.href}>{item.label}</Link></li>
              ))}
            </ul>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800 md:hidden"
              onClick={() => setIsMenuOpen((value) => !value)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              aria-label="Toggle navigation menu"
            >
              <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {isMenuOpen ? (
                  <path d="M6 6L18 18M6 18L18 6" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
            <ThemeToggle />
          </div>
        </div>
        {isMenuOpen ? (
          <ul id="mobile-navigation" className="mt-3 flex flex-col gap-2 border-t border-zinc-200 pt-3 text-sm dark:border-zinc-800 md:hidden">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={() => setIsMenuOpen(false)}>{item.label}</Link>
              </li>
            ))}
          </ul>
        ) : null}
      </nav>
    </header>
  );
}
