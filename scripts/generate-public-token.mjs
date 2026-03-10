/**
 * Generates a long-lived static JWT suitable for use as
 * NEXT_PUBLIC_AUTHORIZATION_TOKEN.
 *
 * Usage:
 *   JWT_SECRET=<your-secret> node scripts/generate-public-token.mjs
 *
 * Optional: override expiry in days (default 365)
 *   JWT_SECRET=<your-secret> TOKEN_TTL_DAYS=730 node scripts/generate-public-token.mjs
 */

import { createHmac } from 'crypto';

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('Error: JWT_SECRET environment variable is required.');
  process.exit(1);
}

const ttlDays = Number(process.env.TOKEN_TTL_DAYS ?? 365);
if (!Number.isFinite(ttlDays) || ttlDays <= 0) {
  console.error('Error: TOKEN_TTL_DAYS must be a positive number.');
  process.exit(1);
}

const toBase64Url = (input) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const now = Math.floor(Date.now() / 1000);
const exp = now + ttlDays * 24 * 60 * 60;

const header = { alg: 'HS256', typ: 'JWT' };
const payload = {
  source: 'resume-web-client',
  type: 'public-static',
  iat: now,
  exp,
};

const encodedHeader = toBase64Url(JSON.stringify(header));
const encodedPayload = toBase64Url(JSON.stringify(payload));
const signature = createHmac('sha256', secret)
  .update(`${encodedHeader}.${encodedPayload}`)
  .digest('base64')
  .replace(/=/g, '')
  .replace(/\+/g, '-')
  .replace(/\//g, '_');

const token = `${encodedHeader}.${encodedPayload}.${signature}`;

const expiresAt = new Date(exp * 1000).toISOString();

console.log('\nGenerated token (valid for', ttlDays, 'days, expires', expiresAt + '):\n');
console.log(token);
console.log('\nSet this in your environment:\n');
console.log(`NEXT_PUBLIC_AUTHORIZATION_TOKEN=${token}`);
