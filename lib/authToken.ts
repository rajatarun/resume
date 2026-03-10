import { createHmac } from 'crypto';
import { getSiweSessionNonce } from '@/lib/web3/siweNonce';

type AuthPayload = Record<string, unknown>;

const DEFAULT_PAYLOAD: AuthPayload = {
  source: 'resume-web-client'
};

const ONE_HOUR_SECONDS = 60 * 60;

const resolveFeatureFromUri = (uri: string): string | undefined => {
  const normalized = uri.trim();
  if (!normalized) {
    return undefined;
  }

  const pathname = (() => {
    if (normalized.startsWith('/')) {
      return normalized;
    }

    try {
      return new URL(normalized).pathname;
    } catch {
      return normalized;
    }
  })();

  return pathname.split('/').filter(Boolean)[0];
};

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

const isValidJwtFormat = (token: string): boolean => {
  const parts = token.split('.');
  return parts.length === 3 && parts.every(Boolean);
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
    const feature = payload?.feature as string | undefined;
    if (feature) {
      const featureEnvKey = `NEXT_PUBLIC_AUTHORIZATION_TOKEN_${feature.toUpperCase()}`;
      const featureToken = (process.env as Record<string, string | undefined>)[featureEnvKey];
      if (featureToken && isValidJwtFormat(featureToken)) {
        return featureToken;
      }
    }
    return publicToken && isValidJwtFormat(publicToken) ? publicToken : undefined;
  }

  const secret = process.env.JWT_TOKEN;
  if (!secret) {
    return publicToken && isValidJwtFormat(publicToken) ? publicToken : undefined;
  }

  return createJwtToken({ ...DEFAULT_PAYLOAD, ...(siweNonce ? { nonce: siweNonce } : {}), ...(payload ?? {}) }, secret);
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

export const buildAuthorizationHeaderForUri = (uri: string, payload?: AuthPayload): Record<string, string> => {
  const feature = resolveFeatureFromUri(uri);
  return buildAuthorizationHeader({ ...(payload ?? {}), ...(feature ? { feature } : {}) });
};
