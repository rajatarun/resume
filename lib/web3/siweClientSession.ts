import { siweMe, siweSession } from "@/lib/siweClient";

const TOKEN_KEY = "siwe_token";
const ADDRESS_KEY = "siwe_address";
const SESSION_EVENT = "siwe-session-change";

let memoryToken: string | null = null;
let memoryAddress: string | null = null;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function hydrateFromStorage() {
  if (!canUseStorage()) return;

  if (memoryToken === null) {
    memoryToken = window.localStorage.getItem(TOKEN_KEY);
  }

  if (memoryAddress === null) {
    memoryAddress = window.localStorage.getItem(ADDRESS_KEY);
  }
}

function broadcastSessionChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_EVENT));
  }
}

export function getSiweSession() {
  hydrateFromStorage();
  return {
    token: memoryToken,
    address: memoryAddress,
    signedIn: Boolean(memoryToken)
  };
}

export function setSiweSession(token: string, address?: string) {
  memoryToken = token;
  memoryAddress = address ?? null;

  if (canUseStorage()) {
    window.localStorage.setItem(TOKEN_KEY, token);
    if (address) {
      window.localStorage.setItem(ADDRESS_KEY, address);
    } else {
      window.localStorage.removeItem(ADDRESS_KEY);
    }
  }

  broadcastSessionChange();
}

export function clearSiweSession() {
  memoryToken = null;
  memoryAddress = null;

  if (canUseStorage()) {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(ADDRESS_KEY);
  }

  broadcastSessionChange();
}

export async function restoreSiweSession() {
  const { token } = getSiweSession();

  if (!token) {
    clearSiweSession();
    return { authenticated: false };
  }

  try {
    const session = await siweSession(token);
    if (session.authenticated) {
      if (session.address && session.address !== memoryAddress) {
        setSiweSession(token, session.address);
      }
      return { authenticated: true, address: session.address };
    }
  } catch {
    // fall through to /siwe/me check
  }

  try {
    const me = await siweMe(token);
    if (me.authenticated) {
      if (me.address && me.address !== memoryAddress) {
        setSiweSession(token, me.address);
      }
      return { authenticated: true, address: me.address };
    }
  } catch {
    // Invalid/expired token or upstream error.
  }

  clearSiweSession();
  return { authenticated: false };
}

export function onSiweSessionChange(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(SESSION_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(SESSION_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
