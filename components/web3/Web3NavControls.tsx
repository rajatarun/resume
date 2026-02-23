"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { SiweButton } from "@/components/web3/SiweButton";

type SessionResponse = {
  signedIn: boolean;
  session?: {
    issuedAt: string;
  };
};

export function Web3NavControls() {
  const { isConnected } = useAccount();
  const [signedIn, setSignedIn] = useState(false);

  const refreshSession = useCallback(async () => {
    const response = await fetch("/api/siwe/session", { cache: "no-store" });
    if (!response.ok) return;
    const body = (await response.json()) as SessionResponse;
    setSignedIn(body.signedIn);
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const logout = async () => {
    await fetch("/api/siwe/logout", { method: "POST" });
    setSignedIn(false);
  };

  const showWeb3Links = isConnected || signedIn;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <ConnectWallet />
        {isConnected && !signedIn && <SiweButton onSuccess={refreshSession} />}
        {signedIn && (
          <button
            type="button"
            onClick={logout}
            className="focus-ring rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Logout
          </button>
        )}
      </div>
      {showWeb3Links && (
        <div className="flex items-center gap-1">
          <Link
            href="/proof"
            className="focus-ring whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            Proof
          </Link>
          <Link
            href="/onchain"
            className="focus-ring whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            Onchain
          </Link>
        </div>
      )}
    </div>
  );
}
