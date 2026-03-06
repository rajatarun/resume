"use client";

import Link from "next/link";
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
  const isContentManagerActive = !isAgentManagementActive;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        <Link
          href="/admin"
          className={`-mb-px border-b-2 px-3 py-2 text-sm ${isContentManagerActive ? "border-slate-900 font-medium" : "border-transparent text-slate-500"}`}
        >
          Content Manager
        </Link>
        <Link
          href="/admin?tab=agent-management"
          className={`-mb-px border-b-2 px-3 py-2 text-sm ${isAgentManagementActive ? "border-slate-900 font-medium" : "border-transparent text-slate-500"}`}
        >
          Agent Management
        </Link>
      </div>

      {isContentManagerActive && (
        <nav className="sticky top-0 z-10 -mx-2 flex gap-2 overflow-auto border-y bg-slate-50 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-slate-50/90">
          {ADMIN_LINKS.map(([href, label]) => {
            const isActive = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                className={`rounded border px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${isActive ? "border-slate-900 font-medium" : ""}`}
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

