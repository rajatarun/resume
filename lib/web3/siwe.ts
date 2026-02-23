import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const NONCE_COOKIE = "siwe_nonce";
const SESSION_COOKIE = "siwe_session";

type SessionPayload = {
  address: `0x${string}`;
  chainId: number;
  issuedAt: string;
  ensName?: string;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString();
}

function getSessionSecret() {
  return process.env.SIWE_SESSION_SECRET ?? "";
}

function signValue(value: string) {
  const secret = getSessionSecret();
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createNonce() {
  return randomBytes(16).toString("hex");
}

export function setNonceCookie(nonce: string) {
  cookies().set(NONCE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10
  });
}

export function getNonceFromCookie() {
  return cookies().get(NONCE_COOKIE)?.value;
}

export function clearNonceCookie() {
  cookies().delete(NONCE_COOKIE);
}

export function setSessionCookie(payload: SessionPayload) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signValue(encodedPayload);
  cookies().set(SESSION_COOKIE, `${encodedPayload}.${signature}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24
  });
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

export function getSessionFromCookie(): SessionPayload | null {
  const secret = getSessionSecret();
  const cookieValue = cookies().get(SESSION_COOKIE)?.value;

  if (!secret || !cookieValue) {
    return null;
  }

  const [encodedPayload, signature] = cookieValue.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expected = signValue(encodedPayload);

  if (signature.length !== expected.length) {
    return null;
  }

  const valid = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!valid) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
  } catch {
    return null;
  }
}

export type { SessionPayload };

// TODO: Add session rotation, revocation, and user-agent/IP binding before production rollout.
