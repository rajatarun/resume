"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type Chain = { id: number; name: string };

type WagmiContextValue = {
  address?: `0x${string}`;
  chain?: Chain;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const WagmiContext = createContext<WagmiContextValue | null>(null);

function getEthereum(): EthereumProvider | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { ethereum?: EthereumProvider }).ethereum;
}

function chainNameFromId(chainId?: number) {
  if (!chainId) return "Unknown chain";
  if (chainId === 1) return "Ethereum";
  if (chainId === 11155111) return "Sepolia";
  return `Chain ${chainId}`;
}

export function WagmiProvider({ children }: { children: React.ReactNode; config: unknown }) {
  const [address, setAddress] = useState<`0x${string}` | undefined>();
  const [chainId, setChainId] = useState<number | undefined>();
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = async () => {
    const ethereum = getEthereum();
    if (!ethereum) {
      throw new Error("No EIP-1193 wallet detected.");
    }

    setIsConnecting(true);
    try {
      const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const chainHex = (await ethereum.request({ method: "eth_chainId" })) as string;
      if (accounts?.[0]) setAddress(accounts[0] as `0x${string}`);
      if (chainHex) setChainId(parseInt(chainHex, 16));
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => setAddress(undefined);

  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) return;

    ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        const list = accounts as string[];
        if (list?.[0]) setAddress(list[0] as `0x${string}`);
      })
      .catch(() => undefined);

    ethereum
      .request({ method: "eth_chainId" })
      .then((hex) => setChainId(parseInt(hex as string, 16)))
      .catch(() => undefined);
  }, []);

  const value = useMemo<WagmiContextValue>(
    () => ({
      address,
      chain: chainId ? { id: chainId, name: chainNameFromId(chainId) } : undefined,
      isConnected: Boolean(address),
      isConnecting,
      connect,
      disconnect
    }),
    [address, chainId, isConnecting]
  );

  return <WagmiContext.Provider value={value}>{children}</WagmiContext.Provider>;
}

function useWagmi() {
  const ctx = useContext(WagmiContext);
  if (!ctx) throw new Error("WagmiProvider missing");
  return ctx;
}

export function useAccount() {
  const { address, chain, isConnected, isConnecting } = useWagmi();
  return { address, chain, isConnected, isConnecting };
}

export function useDisconnect() {
  const { disconnect } = useWagmi();
  return { disconnect };
}

export function useChainId() {
  const { chain } = useWagmi();
  return chain?.id ?? 1;
}

export function useSignMessage() {
  const { address } = useWagmi();
  const [isPending, setIsPending] = useState(false);

  return {
    isPending,
    signMessageAsync: async ({ message }: { message: string }) => {
      const ethereum = getEthereum();
      if (!ethereum || !address) throw new Error("Wallet not connected.");
      setIsPending(true);
      try {
        const signature = await ethereum.request({
          method: "personal_sign",
          params: [message, address]
        });
        return signature as string;
      } finally {
        setIsPending(false);
      }
    }
  };
}

export function useEnsName({ address }: { address?: string; chainId?: number; query?: { enabled?: boolean } }) {
  return { data: undefined as string | undefined, isLoading: false };
}

export function useEnsAvatar({ name }: { name?: string; chainId?: number; query?: { enabled?: boolean } }) {
  return { data: undefined as string | undefined, isLoading: false };
}

export function useBalance({ address }: { address?: string; query?: { enabled?: boolean } }) {
  const [data, setData] = useState<{ formatted: string; symbol: string } | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    const ethereum = getEthereum();
    if (!ethereum) return;

    setIsLoading(true);
    ethereum
      .request({ method: "eth_getBalance", params: [address, "latest"] })
      .then((hex) => {
        const wei = BigInt(hex as string);
        const eth = Number(wei) / 1e18;
        setData({ formatted: eth.toFixed(4), symbol: "ETH" });
      })
      .finally(() => setIsLoading(false));
  }, [address]);

  return { data, isLoading };
}

export function createConfig<T>(config: T) {
  return config;
}

export function createStorage<T>(options: T) {
  return options;
}

export const cookieStorage = {};

export function http() {
  return {};
}
