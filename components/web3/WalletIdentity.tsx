"use client";

import { useState } from "react";
import { useAccount, useEnsName } from "wagmi";

function short(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

type WalletIdentityProps = {
  signedIn: boolean;
  lastSignIn?: string;
};

export function WalletIdentity({ signedIn, lastSignIn }: WalletIdentityProps) {
  const { address, chain, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ address, chainId: 1, query: { enabled: Boolean(address) } });
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-semibold">Wallet proof</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300">Connected identity: {isConnected ? ensName ?? short(address) : "Not connected"}</p>
      <p className="text-sm text-slate-600 dark:text-slate-300">Chain: {chain?.name ?? "Not connected"}</p>
      <p className="text-sm text-slate-600 dark:text-slate-300">Signed in: {signedIn ? "Yes" : "No"}</p>
      <p className="text-sm text-slate-600 dark:text-slate-300">Last sign-in: {lastSignIn ? new Date(lastSignIn).toLocaleString() : "N/A"}</p>
      <button
        type="button"
        onClick={onCopy}
        disabled={!address}
        className="focus-ring rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
      >
        {copied ? "Address copied" : "Copy my address"}
      </button>
    </div>
  );
}
