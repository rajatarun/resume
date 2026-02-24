"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatPane } from "@/components/ChatPane";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { SiweButton } from "@/components/web3/SiweButton";
import { onSiweSessionChange, restoreSiweSession } from "@/lib/web3/siweClientSession";

type RecruiterGateProps = {
  requireWalletGate: boolean;
};

export function RecruiterGate({ requireWalletGate }: RecruiterGateProps) {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);

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
            ? "Connect your wallet and complete Sign in with Ethereum to unlock recruiter insights."
            : "Wallet gate is disabled. Chat is available without connecting a wallet."}
        </p>
      </div>

      {requireWalletGate ? (
        <div className="flex flex-wrap items-center gap-3">
          <ConnectWallet />
          {!signedIn && <SiweButton onSuccess={refreshSession} />}
        </div>
      ) : null}

      {showChat ? <ChatPane mode="recruiter" /> : null}
    </div>
  );
}
