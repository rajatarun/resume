"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useSearchParams } from "next/navigation";

const ADMIN_LINKS = [
  ["/admin", "Dashboard"],
  ["/admin/articles", "Articles"],
  ["/admin/newsletter", "Newsletter"],
  ["/admin/subscribers", "Subscribers"],
  ["/admin/settings", "Settings"],
] as const;

export function AdminNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const isAgentManagementActive = pathname === "/admin" && tabParam === "agent-management";
  const isTasksActive = pathname.startsWith("/admin/tasks");
  const isHomeAutomationActive = pathname.startsWith("/admin/home-automation");
  const isPlatformActive = pathname.startsWith("/admin/platform");
  // Content Manager is active by elimination, so every sibling tab has to be
  // listed here. A new route that is not excluded lights this tab up too, and
  // two tabs read as current at once.
  const isContentManagerActive =
    !isAgentManagementActive && !isTasksActive && !isHomeAutomationActive && !isPlatformActive;

  // Short labels so all five fit one line at 390px. The long names wrapped to
  // two lines on a phone and pushed the content below the fold; the tab strip
  // is the one piece of chrome that should never cost a third of the screen.
  const tabs: Array<{ href: Route; label: string; active: boolean }> = [
    { href: "/admin" as Route, label: "Content", active: isContentManagerActive },
    { href: "/admin?tab=agent-management" as Route, label: "Agents", active: isAgentManagementActive },
    { href: "/admin/tasks" as Route, label: "Tasks", active: isTasksActive },
    { href: "/admin/home-automation" as Route, label: "Home", active: isHomeAutomationActive },
    { href: "/admin/platform" as Route, label: "Platform", active: isPlatformActive },
  ];

  return (
    <div className="space-y-4">
      <nav
        aria-label="Admin sections"
        className="-mx-1 flex gap-1 overflow-x-auto border-b px-1 dark:border-slate-700"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm ${
              tab.active
                ? "border-slate-900 font-semibold text-slate-900 dark:border-slate-100 dark:text-slate-100"
                : "border-transparent text-slate-500"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {isContentManagerActive && (
        <nav className="sticky top-0 z-10 -mx-2 flex gap-2 overflow-auto border-y bg-slate-50 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-slate-50/90">
          {ADMIN_LINKS.map(([href, label]) => {
            const isActive = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                className={`shrink-0 whitespace-nowrap rounded border px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${isActive ? "border-slate-900 font-medium" : ""}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
