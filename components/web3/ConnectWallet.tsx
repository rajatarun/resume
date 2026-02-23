"use client";

import { useEffect, useMemo, useState } from "react";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount, useDisconnect, useEnsName } from "wagmi";
import { supportedChains } from "@/lib/web3/wagmiConfig";

function shortenAddress(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function ConnectWallet() {
  const { open } = useWeb3Modal();
  const { address, chain, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName, isLoading: ensLoading } = useEnsName({
    address,
    chainId: 1,
    query: { enabled: Boolean(address) }
  });

  const [error, setError] = useState<string | null>(null);
  const [hasInjectedWallet, setHasInjectedWallet] = useState<boolean>(true);

  useEffect(() => {
    setHasInjectedWallet(typeof window === "undefined" ? true : Boolean((window as Window & { ethereum?: unknown }).ethereum));
  }, []);

  const supportedChain = useMemo(
    () => (chain ? supportedChains.some((item) => item.id === chain.id) : true),
    [chain]
  );

  const handleOpenModal = async () => {
    try {
      setError(null);
      await open();
    } catch (modalError) {
      const message = modalError instanceof Error ? modalError.message : "Failed to connect wallet.";
      if (/rejected|denied/i.test(message)) {
        setError("Connection was rejected. Please approve the wallet request to continue.");
        return;
      }
      setError(message);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={handleOpenModal}
          className="focus-ring rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
        {!hasInjectedWallet && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">No browser wallet detected. Use WalletConnect or Coinbase Wallet.</p>
        )}
        {error && <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900">
      <div className="text-right leading-tight">
        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{ensLoading ? "Loading..." : ensName ?? shortenAddress(address)}</p>
        <p className="flex items-center justify-end gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <span className={`h-1.5 w-1.5 rounded-full ${supportedChain ? "bg-emerald-500" : "bg-red-500"}`} />
          {chain?.name ?? "Unknown chain"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => disconnect()}
        className="focus-ring rounded-md px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Disconnect
      </button>
      {!supportedChain && <span className="text-[11px] text-red-600 dark:text-red-400">Wrong network</span>}
    </div>
  );
}
