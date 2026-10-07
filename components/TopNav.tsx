"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { Web3NavControls } from "@/components/web3/Web3NavControls";
import { HOME_NAV_STYLES } from "@/lib/featureFlags";

type NavTone = "hero" | "light" | "dark" | "accent";

/**
 * On the terracotta homepage the nav is a floating glass pill whose tint follows the
 * section beneath it. Sections declare their tone with data-nav-tone; this
 * reads which one sits under the pill's centre line on every scroll frame.
 * It starts at "hero" so the first paint matches the hero without a flash.
 */
function useNavTone(enabled: boolean): NavTone {
  const [tone, setTone] = useState<NavTone>("hero");

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const probe = 40; // the pill's vertical centre: 12px offset + half its height
      let next: NavTone = "light";
      document.querySelectorAll<HTMLElement>("[data-nav-tone]").forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= probe && rect.bottom > probe) next = section.dataset.navTone as NavTone;
      });
      setTone(next);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [enabled]);

  return tone;
}

const glassLink = "focus-ring whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition hover:bg-[var(--nav-hover)]";

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
  { href: "/about" as Route, label: "About" },
  { href: "/labs" as Route, label: "AI Lab" },
  { href: "/store" as Route, label: "Store" }
];

const dropdownGroups: NavGroup[] = [
  {
    label: "Work",
    items: [
      { href: "/resume" as Route, label: "Resume" },
      { href: "/portfolio" as Route, label: "Portfolio" },
      { href: "/publications" as Route, label: "Publications" },
      { href: "/website" as Route, label: "Website" }
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
      { href: "/appointment" as Route, label: "Let's Talk" }
    ]
  }
];

type NavLinkProps = {
  item: NavItem;
  className: string;
  onClick?: () => void;
  currentPathname?: string;
};

/**
 * Routes too heavy to prefetch from every page. Next prefetches any link in
 * the viewport, and for /labs that means downloading and parsing its charting
 * library (recharts, ~115 KB) on pages that never draw a chart; it showed up
 * in Lighthouse as a 134 ms main-thread task on the homepage. They still load
 * on click.
 */
export const NO_PREFETCH_ROUTES: ReadonlySet<string> = new Set(["/labs", "/admin"]);

function NavLink({ item, className, onClick, currentPathname }: NavLinkProps) {
  const isCurrent = !item.external && currentPathname === item.href;

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
    <Link
      href={item.href}
      prefetch={NO_PREFETCH_ROUTES.has(item.href) ? false : undefined}
      className={className}
      onClick={onClick}
      aria-current={isCurrent ? "page" : undefined}
    >
      {item.label}
    </Link>
  );
}

function DesktopDropdown({ label, items, currentPathname, glass }: NavGroup & { currentPathname: string; glass: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen((prev) => !prev)}
        className={
          glass
            ? `${glassLink} flex cursor-pointer items-center gap-1`
            : "focus-ring flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
        }
      >
        {label}
        <span aria-hidden="true" className="text-xs">
          ▾
        </span>
      </button>
      {isOpen && (
        <div
          className={
            glass
              ? "liquid-glass liquid-menu absolute left-0 top-full z-50 mt-3 min-w-44 rounded-2xl p-2"
              : "absolute left-0 top-full z-50 mt-2 min-w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900"
          }
        >
          {items.map((item) => (
            <NavLink
              key={`${item.label}-${item.href}`}
              item={item}
              currentPathname={currentPathname}
              className={
                glass
                  ? "focus-ring relative block rounded-xl px-3 py-2 text-sm transition hover:bg-[var(--nav-hover)]"
                  : "focus-ring block rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              }
              onClick={() => setIsOpen(false)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * On the homepage both bars are rendered and the CSS inlined in <head>
 * (lib/homeDesignBoot.ts) shows the one the live design declares. That is
 * decided before first paint, so a design never shows with the other
 * design's nav while the page's scripts load. Elsewhere: the standard bar.
 */
export function TopNav() {
  const pathname = usePathname();
  if (pathname !== "/") return <NavBar glass={false} />;
  return (
    <>
      {HOME_NAV_STYLES.map((style) => (
        <div key={style} data-home-nav={style}>
          <NavBar glass={style === "glass"} />
        </div>
      ))}
    </>
  );
}

function NavBar({ glass }: { glass: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const { isConnected } = useAccount();
  const pathname = usePathname();
  // The floating glass pill, for homepage designs that declare it.
  const isHome = glass;
  const tone = useNavTone(isHome);

  const primaryNavItems = isConnected
    ? [...primaryLinks, { href: "/admin" as Route, label: "Admin" }]
    : primaryLinks;

  return (
    <header
      data-tone={isHome ? (isOpen ? "light" : tone) : undefined}
      className={
        isHome
          ? "liquid-nav fixed inset-x-0 top-3 z-40 px-3 sm:px-6"
          : "fixed left-0 right-0 top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85"
      }
    >
      <div
        className={
          isHome
            ? `relative mx-auto w-full max-w-6xl px-4 py-2 sm:px-5 ${isOpen ? "rounded-[28px]" : "rounded-full"}`
            : "mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 lg:px-8"
        }
      >
        {isHome && (
          <div aria-hidden="true" className={`liquid-glass absolute inset-0 rounded-[inherit] ${isOpen ? "liquid-menu" : ""}`} />
        )}
        <div className={isHome ? "relative" : undefined}>
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className={`focus-ring text-lg font-semibold tracking-tight ${isHome ? "whitespace-nowrap rounded-full px-2" : ""}`}>
            Tarun Raja
          </Link>

          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
            onClick={() => setIsOpen((prev) => !prev)}
            className={
              isHome
                ? "focus-ring rounded-full border border-[var(--nav-rim)] px-4 py-1.5 text-sm font-medium transition hover:bg-[var(--nav-hover)] lg:hidden"
                : "focus-ring rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 md:hidden dark:border-slate-700 dark:text-slate-200"
            }
          >
            Menu
          </button>

          <nav aria-label="Primary navigation" className={`hidden items-center gap-1 ${isHome ? "lg:flex" : "md:flex"}`}>
            {primaryNavItems.map((item) => (
              <NavLink
                key={`${item.label}-${item.href}`}
                item={item}
                currentPathname={pathname}
                className={
                  isHome
                    ? glassLink
                    : "focus-ring rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                }
              />
            ))}
            {dropdownGroups.map((group) => (
              <DesktopDropdown key={group.label} {...group} currentPathname={pathname} glass={isHome} />
            ))}
          </nav>
          {/* The glass pill is narrower than the bar, so it switches to the menu below lg. */}
          <div className={isHome ? "hidden lg:block" : "hidden md:block"}>
            <Web3NavControls glass={isHome} />
          </div>
        </div>

        {isOpen && (
          <nav
            id="mobile-nav"
            aria-label="Mobile primary navigation"
            className={`mt-3 space-y-3 border-t border-slate-200 pt-3 dark:border-slate-800 ${isHome ? "lg:hidden" : "md:hidden"}`}
          >
            <div className="grid gap-2">
              {primaryNavItems.map((item) => (
                <NavLink
                  key={`${item.label}-${item.href}`}
                  item={item}
                  currentPathname={pathname}
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
                    currentPathname={pathname}
                    className="focus-ring block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => setIsOpen(false)}
                  />
                ))}
              </div>
            ))}
            <div className="pt-1">
              <Web3NavControls glass={isHome} />
            </div>
          </nav>
        )}
        </div>
      </div>
    </header>
  );
}
