"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatPane } from "@/components/ChatPane";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { SiweButton } from "@/components/web3/SiweButton";
import { onSiweSessionChange, restoreSiweSession } from "@/lib/web3/siweClientSession";

type RecruiterGateProps = {
  requireWalletGate: boolean;
};

export function RecruiterGate({ requireWalletGate }: RecruiterGateProps) {
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

  const showChat = !requireWalletGate || signedIn;

  return (
    <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h1 className="text-2xl font-semibold">About Tarun Raja — GenAI Chat Access</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {requireWalletGate
            ? "Connect your wallet and complete Sign in with Ethereum to unlock the GenAI chat about Tarun Raja's background and impact."
            : "Wallet gate is disabled. Use this GenAI chat to learn more about Tarun Raja's experience, projects, and outcomes."}
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
