import { NextResponse } from "next/server";
import { createNonce, setNonceCookie } from "@/lib/web3/siwe";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const nonce = createNonce();
    setNonceCookie(nonce);

    return NextResponse.json({ nonce });
  } catch {
    return NextResponse.json({ error: "Could not generate SIWE nonce." }, { status: 500 });
  }
}
