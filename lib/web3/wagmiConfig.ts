import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? process.env.WALLETCONNECT_PROJECT_ID ?? "";

export const supportedChains = [mainnet, sepolia] as const;

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: [
    injected({ shimDisconnect: true }),
    walletConnect({ projectId, showQrModal: false }),
    coinbaseWallet({
      appName: "Tarun Raja Website",
      appLogoUrl: "https://tarunraja.dev/favicon.ico"
    })
  ],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http()
  }
});

export const walletConnectProjectId = projectId;
