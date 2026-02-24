"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatPane, type RecruiterMode } from "@/components/ChatPane";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { SiweButton } from "@/components/web3/SiweButton";
import { onSiweSessionChange, restoreSiweSession } from "@/lib/web3/siweClientSession";

const modes: RecruiterMode[] = ["Recruiter Mode", "CTO Mode", "Engineer Mode"];

type RecruiterGateProps = {
  requireWalletGate: boolean;
};

export function RecruiterGate({ requireWalletGate }: RecruiterGateProps) {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  const [activeMode, setActiveMode] = useState<RecruiterMode>("Recruiter Mode");

  const refreshSession = useCallback(async () => {
    const session = await restoreSiweSession();
    setSignedIn(session.authenticated);
    if (session.authenticated) {
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    void refreshSession();
    return onSiweSessionChange(() => {
      void refreshSession();
    });
  }, [refreshSession]);

  const showChat = !requireWalletGate || signedIn;

  return (
    <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h1 className="text-2xl font-semibold">Recruiter Access Panel</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {requireWalletGate
            ? "Connect your wallet and complete Sign in with Ethereum to unlock recruiter and leadership-specific modes."
            : "Wallet gate is disabled. Chat is available without connecting a wallet."}
        </p>
      </div>

      {requireWalletGate ? (
        <div className="flex flex-wrap items-center gap-3">
          <ConnectWallet />
          {!signedIn && <SiweButton onSuccess={refreshSession} />}
        </div>
      ) : null}

      {showChat ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {modes.map((mode) => {
              const isActive = mode === activeMode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setActiveMode(mode)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-sky-600 text-white"
                      : "border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>

          <ChatPane mode={activeMode} />
        </div>
      ) : null}
    </div>
  );
}
