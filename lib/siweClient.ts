import { SiweMessage } from "siwe";

export type SiweNonceResponse = {
  sessionId: string;
  nonce: string;
  ttlSeconds?: number;
};

type SiweNonceResponseRaw = JsonRecord & {
  sessionId?: string;
  sessionID?: string;
  sid?: string;
  nonce?: string;
  ttlSeconds?: number;
};

export type SiweVerifyPayload = {
  sessionId: string;
  preparedMessage: string;
  signature: string;
};

export type SiweVerifyResponse = {
  ok?: boolean;
  address?: string;
  token?: string;
};

type JsonRecord = Record<string, unknown>;

type SiweVerifyBody = {
  message?: unknown;
};

function normalizeSiweMessage(input: unknown): string {
  return String(input ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

export function assertValidSiweMessage(body: SiweVerifyBody) {
  const message = normalizeSiweMessage(body.message);

  if (!message) {
    throw new Error("Missing SIWE message");
  }

  let parsed: SiweMessage;
  try {
    parsed = new SiweMessage(message);
  } catch (e) {
    console.error("[siweVerify] Failed to parse SIWE message", { message, body, e });
    throw new Error("Invalid SIWE message (cannot be parsed).");
  }

  const ok =
    Boolean(parsed.domain) &&
    Boolean(parsed.address) &&
    Boolean(parsed.uri) &&
    Boolean(parsed.version) &&
    Boolean(parsed.nonce) &&
    Boolean(parsed.chainId);

  if (!ok) {
    console.error("[siweVerify] Parsed SIWE missing required fields", { parsed, body });
    throw new Error("Invalid SIWE message (missing required fields).");
  }

  return { message, parsed };
}

function getSiweApiBase() {
  const base = process.env.NEXT_PUBLIC_SIWE_API_BASE;
  if (!base) {
    throw new Error("NEXT_PUBLIC_SIWE_API_BASE is not configured.");
  }

  return base.replace(/\/$/, "");
}

async function parseResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const payload = (await response.json().catch(() => null)) as JsonRecord | null;

  if (!response.ok) {
    const message =
      (payload && typeof payload.error === "string" && payload.error) ||
      (payload && typeof payload.message === "string" && payload.message) ||
      fallbackMessage;
    throw new Error(`${message} (status ${response.status})`);
  }

  return (payload ?? {}) as T;
}

export async function siweNonce() {
  const response = await fetch(`${getSiweApiBase()}/siwe/nonce`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    cache: "no-store"
  });

  const data = await parseResponse<SiweNonceResponseRaw>(response, "Could not fetch SIWE nonce.");

  const sessionId = data.sessionId ?? data.sessionID ?? data.sid;
  if (!sessionId || !data.nonce) {
    throw new Error("SIWE nonce response is missing sessionId or nonce.");
  }

  return { sessionId, nonce: data.nonce, ttlSeconds: data.ttlSeconds };
}

export async function siweVerify(payload: SiweVerifyPayload) {
  if (!payload.sessionId || !payload.preparedMessage || !payload.signature) {
    throw new Error("SIWE verify payload must include sessionId, preparedMessage, and signature.");
  }

  const { message } = assertValidSiweMessage({ message: payload.preparedMessage });

  const body = {
    sessionId: payload.sessionId,
    message,
    signature: payload.signature
  };

  const response = await fetch(`${getSiweApiBase()}/siwe/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return parseResponse<SiweVerifyResponse>(response, "SIWE verification failed.");
}

export async function siweMe(token: string) {
  const response = await fetch(`${getSiweApiBase()}/siwe/me`, {
    method: "GET",
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store"
  });

  return parseResponse<{ authenticated?: boolean; address?: string }>(
    response,
    "Could not fetch SIWE profile."
  );
}

export async function siweSession(token: string) {
  const response = await fetch(`${getSiweApiBase()}/siwe/session`, {
    method: "GET",
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store"
  });

  return parseResponse<{ authenticated?: boolean; address?: string }>(
    response,
    "Could not fetch SIWE session."
  );
}
