"use client";

import { ReactNode } from "react";
import { AdminGate } from "@/components/admin/AdminGate";
import { ToastProvider } from "@/components/admin/ToastProvider";
import { AdminNavigation } from "@/components/admin/AdminNavigation";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AdminGate>
        <div className="space-y-5">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <AdminNavigation />
          {children}
        </div>
      </AdminGate>
    </ToastProvider>
  );
}
