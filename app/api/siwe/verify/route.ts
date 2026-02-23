import { NextRequest, NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import {
  clearNonceCookie,
  getNonceFromCookie,
  setSessionCookie
} from "@/lib/web3/siwe";

export async function POST(request: NextRequest) {
  try {
    const domain = process.env.SIWE_DOMAIN;
    if (!domain || !process.env.SIWE_SESSION_SECRET) {
      return NextResponse.json({ error: "SIWE server env is not configured." }, { status: 500 });
    }

    const body = (await request.json()) as { message?: string; signature?: string };
    if (!body.message || !body.signature) {
      return NextResponse.json({ error: "Missing message or signature." }, { status: 400 });
    }

    const nonceCookie = getNonceFromCookie();
    if (!nonceCookie) {
      return NextResponse.json({ error: "Missing nonce cookie." }, { status: 400 });
    }

    const siweMessage = new SiweMessage(body.message);

    if (siweMessage.nonce !== nonceCookie) {
      return NextResponse.json({ error: "Invalid nonce." }, { status: 400 });
    }

    const verification = await siweMessage.verify({
      signature: body.signature,
      nonce: nonceCookie,
      domain
    });

    if (!verification.success) {
      return NextResponse.json({ error: "Invalid SIWE signature." }, { status: 401 });
    }

    setSessionCookie({
      address: siweMessage.address as `0x${string}`,
      chainId: siweMessage.chainId,
      issuedAt: new Date().toISOString()
    });

    clearNonceCookie();

    // TODO: Persist session + nonce records in durable storage for auditability and explicit replay protection in distributed environments.
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "SIWE verification failed." }, { status: 400 });
  }
}
