"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { SiweButton } from "@/components/web3/SiweButton";
import {
  clearSiweSession,
  onSiweSessionChange,
  restoreSiweSession
} from "@/lib/web3/siweClientSession";

/** `glass`: the homepage's floating glass nav — one line, colours inherited from the pill. */
export function Web3NavControls({ glass = false }: { glass?: boolean } = {}) {
  const { isConnected } = useAccount();
  const [signedIn, setSignedIn] = useState(false);

  const refreshSession = useCallback(async () => {
    const session = await restoreSiweSession();
    setSignedIn(session.authenticated);
  }, []);

  useEffect(() => {
    void refreshSession();
    return onSiweSessionChange(() => {
      void refreshSession();
    });
  }, [refreshSession]);

  const logout = () => {
    clearSiweSession();
    setSignedIn(false);
  };

  const showWeb3Links = isConnected || signedIn;

  return (
    <div className={glass ? "flex items-center gap-2" : "flex flex-col items-end gap-2"}>
      <div className="flex items-center gap-2">
        <ConnectWallet glass={glass} />
        {isConnected && !signedIn && <SiweButton onSuccess={refreshSession} />}
        {signedIn && (
          <button
            type="button"
            onClick={logout}
            className={
              glass
                ? "focus-ring rounded-full border border-[var(--nav-rim)] px-3 py-1.5 text-xs font-medium transition hover:bg-[var(--nav-hover)]"
                : "focus-ring rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            }
          >
            Logout
          </button>
        )}
      </div>
      {showWeb3Links && (
        <div className="flex items-center gap-1">
          <Link
            href="/proof"
            className={glass ? "focus-ring whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition hover:bg-[var(--nav-hover)]" : "focus-ring whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"}
          >
            Proof
          </Link>
          <Link
            href="/onchain"
            className={glass ? "focus-ring whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition hover:bg-[var(--nav-hover)]" : "focus-ring whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"}
          >
            Onchain
          </Link>
        </div>
      )}
    </div>
  );
}
