import { NextResponse } from "next/server";
import { createNonce, setNonceCookie } from "@/lib/web3/siwe";

function buildCorsHeaders(): HeadersInit {
  const configuredOrigin = process.env.SIWE_CORS_ORIGIN;

  if (!configuredOrigin) {
    return {};
  }

  // If cross-origin SIWE is enabled, allow credentials for the configured frontend origin.
  return {
    "Access-Control-Allow-Origin": configuredOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function methodNotAllowed() {
  return NextResponse.json(
    { error: "Method not allowed." },
    { status: 405, headers: buildCorsHeaders() }
  );
}

export async function GET() {
  const corsHeaders = buildCorsHeaders();

  try {
    // Generate a fresh cryptographically secure nonce for this SIWE attempt.
    const nonce = createNonce();

    // Persist the nonce in an HTTP-only cookie so the verify route can validate it.
    setNonceCookie(nonce);

    return NextResponse.json({ nonce }, { headers: corsHeaders });
  } catch (error) {
    // Include the original error to make "Could not fetch SIWE nonce" debuggable.
    console.error("Failed to generate SIWE nonce", error);

    return NextResponse.json(
      { error: "Could not generate SIWE nonce." },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST() {
  return methodNotAllowed();
}

export async function PUT() {
  return methodNotAllowed();
}

export async function PATCH() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}

export async function OPTIONS() {
  return methodNotAllowed();
}
