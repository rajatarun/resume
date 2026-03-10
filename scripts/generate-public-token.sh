#!/usr/bin/env bash
# Generates a long-lived static JWT for NEXT_PUBLIC_AUTHORIZATION_TOKEN.
#
# Usage:
#   JWT_SECRET=<your-secret> bash scripts/generate-public-token.sh
#
# Optional: specify a feature scope (e.g. "admin", "site") to generate a
# feature-scoped token for NEXT_PUBLIC_AUTHORIZATION_TOKEN_<FEATURE>:
#   JWT_SECRET=<your-secret> FEATURE=admin bash scripts/generate-public-token.sh
#
# Optional: override expiry in days (default 365)
#   JWT_SECRET=<your-secret> TOKEN_TTL_DAYS=730 bash scripts/generate-public-token.sh
#
# Requires: openssl, base64

set -euo pipefail

if [[ -z "${JWT_SECRET:-}" ]]; then
  echo "Error: JWT_SECRET environment variable is required." >&2
  exit 1
fi

TTL_DAYS="${TOKEN_TTL_DAYS:-365}"
if ! [[ "$TTL_DAYS" =~ ^[0-9]+$ ]] || [[ "$TTL_DAYS" -le 0 ]]; then
  echo "Error: TOKEN_TTL_DAYS must be a positive integer." >&2
  exit 1
fi

base64url() {
  base64 | tr -d '=' | tr '+' '-' | tr '/' '_' | tr -d '\n'
}

NOW=$(date +%s)
EXP=$(( NOW + TTL_DAYS * 86400 ))

FEATURE="${FEATURE:-}"
FEATURE_LOWER=$(echo "$FEATURE" | tr '[:upper:]' '[:lower:]')
FEATURE_UPPER=$(echo "$FEATURE" | tr '[:lower:]' '[:upper:]')

HEADER=$(printf '{"alg":"HS256","typ":"JWT"}' | base64url)
if [[ -n "$FEATURE_LOWER" ]]; then
  PAYLOAD=$(printf '{"source":"resume-web-client","type":"public-static","feature":"%s","iat":%d,"exp":%d}' "$FEATURE_LOWER" "$NOW" "$EXP" | base64url)
else
  PAYLOAD=$(printf '{"source":"resume-web-client","type":"public-static","iat":%d,"exp":%d}' "$NOW" "$EXP" | base64url)
fi

SIGNING_INPUT="${HEADER}.${PAYLOAD}"

SIGNATURE=$(printf '%s' "$SIGNING_INPUT" \
  | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary \
  | base64url)

TOKEN="${SIGNING_INPUT}.${SIGNATURE}"
EXPIRES_AT=$(date -d "@$EXP" --utc '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null \
  || date -r "$EXP" -u '+%Y-%m-%dT%H:%M:%SZ')

echo ""
echo "Generated token (valid for ${TTL_DAYS} days, expires ${EXPIRES_AT}):"
echo ""
echo "$TOKEN"
echo ""
echo "Set this in your environment:"
echo ""
if [[ -n "$FEATURE_UPPER" ]]; then
  echo "NEXT_PUBLIC_AUTHORIZATION_TOKEN_${FEATURE_UPPER}=${TOKEN}"
else
  echo "NEXT_PUBLIC_AUTHORIZATION_TOKEN=${TOKEN}"
fi
