"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { AdminGate } from "@/components/admin/AdminGate";
import { ToastProvider } from "@/components/admin/ToastProvider";

const links = [
  ["/admin", "Dashboard"],
  ["/admin/articles", "Articles"],
  ["/admin/newsletter", "Newsletter"],
  ["/admin/subscribers", "Subscribers"],
  ["/admin/settings", "Settings"]
] as const;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AdminGate>
        <div className="space-y-5">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <nav className="flex gap-2 overflow-auto">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className="rounded border px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                {label}
              </Link>
            ))}
          </nav>
          {children}
        </div>
      </AdminGate>
    </ToastProvider>
  );
}
