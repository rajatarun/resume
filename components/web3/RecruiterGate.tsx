"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { SiweButton } from "@/components/web3/SiweButton";

export function RecruiterGate() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);

  const refreshSession = useCallback(async () => {
    const response = await fetch("/api/siwe/session", { cache: "no-store" });
    if (!response.ok) return;
    const body = (await response.json()) as { signedIn: boolean };
    setSignedIn(body.signedIn);
    if (body.signedIn) {
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-2xl font-semibold">Recruiter access</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Please connect your wallet and complete Sign in with Ethereum to view this page.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ConnectWallet />
        {!signedIn && <SiweButton onSuccess={refreshSession} />}
      </div>
    </div>
  );
}
