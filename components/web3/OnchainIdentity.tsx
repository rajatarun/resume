"use client";

import { useAccount, useBalance, useEnsAvatar, useEnsName } from "wagmi";

function short(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function OnchainIdentity() {
  const { address, isConnected, chain } = useAccount();
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
    query: { enabled: Boolean(address) }
  });
  const { data: ensName } = useEnsName({
    address,
    chainId: 1,
    query: { enabled: Boolean(address) }
  });
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName,
    chainId: 1,
    query: { enabled: Boolean(ensName) }
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-semibold">Onchain identity</h2>
      {!isConnected && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Connect a wallet to load identity data.</p>}
      {isConnected && (
        <div className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
          <p>Address: {ensName ?? short(address)}</p>
          <p>Chain: {chain?.name ?? "Unknown"}</p>
          <p>Native balance: {balanceLoading ? "Loading..." : `${balance?.formatted ?? "0"} ${balance?.symbol ?? "ETH"}`}</p>
          <div className="flex items-center gap-2">
            <span>ENS avatar:</span>
            {ensAvatar ? (
              <img src={ensAvatar} alt="ENS avatar" className="h-8 w-8 rounded-full border border-slate-300 object-cover dark:border-slate-700" />
            ) : (
              <span className="text-slate-500">Not available</span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            RPC reads use Wagmi default HTTP transports for configured chains; results depend on public RPC availability.
          </p>
        </div>
      )}
    </div>
  );
}
