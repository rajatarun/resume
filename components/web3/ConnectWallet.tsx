"use client";

import { useEffect, useMemo, useState } from "react";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount, useDisconnect, useEnsName } from "wagmi";
import { supportedChains } from "@/lib/web3/wagmiConfig";

const noWalletHint = "No browser wallet detected. Use WalletConnect or Coinbase Wallet.";

function shortenAddress(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** `glass`: rendered inside the homepage's glass nav — inherits its colours and keeps to one line. */
export function ConnectWallet({ glass = false }: { glass?: boolean } = {}) {
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
      <div className={glass ? "relative flex items-center" : "flex flex-col items-end gap-1"}>
        <button
          type="button"
          onClick={handleOpenModal}
          // In the glass nav the "no browser wallet" hint would break the pill
          // onto two lines, so it moves into the tooltip and the accessible
          // description; the modal offers WalletConnect and Coinbase either way.
          title={glass && !hasInjectedWallet ? noWalletHint : undefined}
          aria-describedby={glass && !hasInjectedWallet ? "no-wallet-hint" : undefined}
          className={
            glass
              ? "focus-ring whitespace-nowrap rounded-full border border-[var(--nav-rim)] px-3 py-1.5 text-xs font-medium transition hover:bg-[var(--nav-hover)]"
              : "focus-ring rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          }
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
        {glass && !hasInjectedWallet && (
          <span id="no-wallet-hint" className="sr-only">
            {noWalletHint}
          </span>
        )}
        {!glass && !hasInjectedWallet && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">{noWalletHint}</p>
        )}
        {error && (
          <p
            className={
              glass
                ? "absolute right-0 top-full mt-3 max-w-xs rounded-xl bg-red-600 px-3 py-2 text-[11px] text-white shadow-lg"
                : "text-[11px] text-red-600 dark:text-red-400"
            }
          >
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={
        glass
          ? "flex items-center gap-2 rounded-full border border-[var(--nav-rim)] px-3 py-0.5"
          : "flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900"
      }
    >
      <div className="text-right leading-tight">
        <p className={glass ? "text-xs font-semibold" : "text-xs font-semibold text-slate-900 dark:text-slate-100"}>{ensLoading ? "Loading..." : ensName ?? shortenAddress(address)}</p>
        <p className={glass ? "flex items-center justify-end gap-1 text-[11px] opacity-70" : "flex items-center justify-end gap-1 text-[11px] text-slate-500 dark:text-slate-400"}>
          <span className={`h-1.5 w-1.5 rounded-full ${supportedChain ? "bg-emerald-500" : "bg-red-500"}`} />
          {chain?.name ?? "Unknown chain"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => disconnect()}
        className={
          glass
            ? "focus-ring rounded-full px-2 py-1 text-[11px] transition hover:bg-[var(--nav-hover)]"
            : "focus-ring rounded-md px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        }
      >
        Disconnect
      </button>
      {!supportedChain && <span className="text-[11px] text-red-600 dark:text-red-400">Wrong network</span>}
    </div>
  );
}
