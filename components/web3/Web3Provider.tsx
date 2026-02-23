"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { mainnet } from "wagmi/chains";
import { supportedChains, wagmiConfig, walletConnectProjectId } from "@/lib/web3/wagmiConfig";

const queryClient = new QueryClient();

if (walletConnectProjectId) {
  createWeb3Modal({
    wagmiConfig,
    projectId: walletConnectProjectId,
    chains: supportedChains,
    defaultChain: mainnet,
    enableAnalytics: false
  });
}

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
