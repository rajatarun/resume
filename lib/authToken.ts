import { createHmac } from 'crypto';
import { getSiweSessionNonce } from '@/lib/web3/siweNonce';

type AuthPayload = Record<string, unknown>;

const DEFAULT_PAYLOAD: AuthPayload = {
  source: 'resume-web-client'
};

const ONE_HOUR_SECONDS = 60 * 60;

const toBase64Url = (input: string): string => {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const getPublicAuthorizationToken = (): string | undefined => {
  return process.env.NEXT_PUBLIC_AUTHORIZATION_TOKEN;
};

const createJwtToken = (payload: AuthPayload, secret: string): string => {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const body = {
    ...payload,
    iat: now,
    exp: now + ONE_HOUR_SECONDS
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(body));
  const signature = createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

export const buildAuthorizationToken = (payload?: AuthPayload): string | undefined => {
  const siweNonce = getSiweSessionNonce();
  const publicToken = getPublicAuthorizationToken();

  if (typeof window !== 'undefined') {
    return publicToken;
  }

  const secret = process.env.JWT_TOKEN;
  if (!secret) {
    return publicToken;
  }

  return createJwtToken({ ...DEFAULT_PAYLOAD, ...(siweNonce ? { nounce: siweNonce } : {}), ...(payload ?? {}) }, secret);
};

export const buildAuthorizationHeader = (payload?: AuthPayload): Record<string, string> => {
  const token = buildAuthorizationToken(payload);

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`
  };
};
