const SIWE_NONCE_KEY = "siwe_nonce";

let memoryNonce: string | null = null;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getSiweSessionNonce(): string | null {
  if (canUseStorage()) {
    memoryNonce = window.localStorage.getItem(SIWE_NONCE_KEY);
  }

  return memoryNonce;
}

export function setSiweSessionNonce(nonce: string) {
  memoryNonce = nonce;

  if (canUseStorage()) {
    window.localStorage.setItem(SIWE_NONCE_KEY, nonce);
  }
}

export function clearSiweSessionNonce() {
  memoryNonce = null;

  if (canUseStorage()) {
    window.localStorage.removeItem(SIWE_NONCE_KEY);
  }
}
