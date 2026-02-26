"use client";

import { ReactNode } from "react";
import { useAccount } from "wagmi";
import { ConnectWallet } from "@/components/web3/ConnectWallet";

const ALLOWLIST = ["0x2e948d9eba6734ebfd4706c80ccb5d2632cd2750"];

export function useAdminAccess() {
  const { address, isConnected } = useAccount();
  const normalized = address?.toLowerCase();
  const isAllowed = Boolean(normalized && ALLOWLIST.includes(normalized));
  return { address, isConnected, isAllowed };
}

export function AdminGate({ children }: { children: ReactNode }) {
  const { isConnected, isAllowed, address } = useAdminAccess();

  if (!isConnected) {
    return (
      <div className="rounded-xl border p-6">
        <p className="mb-3 font-medium">Admin access requires wallet connection.</p>
        <ConnectWallet />
      </div>
    );
  }

  if (!isAllowed) {
    return <div className="rounded-xl border p-6 text-red-600">Not authorized for admin access ({address}).</div>;
  }

  return <>{children}</>;
}
