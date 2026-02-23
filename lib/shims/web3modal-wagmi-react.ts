"use client";

import { useCallback } from "react";
import { useAccount } from "wagmi";

export function createWeb3Modal(_: unknown) {
  return undefined;
}

export function useWeb3Modal() {
  const account = useAccount();
  const open = useCallback(async () => {
    if (account.isConnected) return;
    const ethereum = (window as Window & { ethereum?: { request: (args: { method: string }) => Promise<unknown> } }).ethereum;
    if (!ethereum) {
      throw new Error("No wallet available. Install a browser wallet or use a supported wallet app.");
    }
    await ethereum.request({ method: "eth_requestAccounts" });
    window.location.reload();
  }, [account.isConnected]);

  return { open };
}
