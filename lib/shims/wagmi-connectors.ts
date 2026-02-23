export function injected(config?: unknown) {
  return { id: "injected", config };
}

export function walletConnect(config?: unknown) {
  return { id: "walletConnect", config };
}

export function coinbaseWallet(config?: unknown) {
  return { id: "coinbaseWallet", config };
}
