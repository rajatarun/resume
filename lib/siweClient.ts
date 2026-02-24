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
  message: string;
  signature: string;
};

export type SiweVerifyResponse = {
  ok?: boolean;
  address?: string;
  token?: string;
};

type JsonRecord = Record<string, unknown>;

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
  if (!payload.sessionId || !payload.message || !payload.signature) {
    throw new Error("SIWE verify payload must include sessionId, message, and signature.");
  }

  const body = {
    sessionId: payload.sessionId,
    message: payload.message,
    signature: payload.signature
  };

  if (process.env.NODE_ENV !== "production") {
    console.debug("[siweVerify] typeof body.message", typeof body.message);
    console.debug("[siweVerify] body.message.slice(0, 80)", body.message.slice(0, 80));
    console.debug(
      "[siweVerify] body.message includes sign-in phrase",
      body.message.includes(" wants you to sign in with your Ethereum account:")
    );
    console.debug("[siweVerify] body.message includes URI block", body.message.includes("\n\nURI:"));
  }

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
