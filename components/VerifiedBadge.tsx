"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { isRecruiterPassHolder } from "@/lib/recruiterPass";
import { getSiweSession, onSiweSessionChange, restoreSiweSession } from "@/lib/web3/siweClientSession";

export function VerifiedBadge() {
  const [authenticated, setAuthenticated] = useState(false);
  const [holder, setHolder] = useState(false);

  const refresh = useCallback(async () => {
    const session = await restoreSiweSession();
    setAuthenticated(session.authenticated);

    if (!session.authenticated || !session.address || !getSiweSession().token) {
      setHolder(false);
      return;
    }

    const isHolder = await isRecruiterPassHolder(session.address);
    setHolder(isHolder);
  }, []);

  useEffect(() => {
    void refresh();
    return onSiweSessionChange(() => {
      void refresh();
    });
  }, [refresh]);

  if (!authenticated) {
    return (
      <Link href="/recruiter" className="text-xs text-slate-500 underline-offset-4 hover:underline dark:text-slate-400">
        Sign in to verify
      </Link>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        holder
          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
      }`}
    >
      {holder ? "⭐ Verified+" : "✅ Verified"}
    </span>
  );
}
