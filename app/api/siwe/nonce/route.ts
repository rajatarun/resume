import { NextResponse } from "next/server";
import { createNonce, setNonceCookie } from "@/lib/web3/siwe";

export async function GET() {
  const nonce = createNonce();
  setNonceCookie(nonce);
  return NextResponse.json({ nonce });
}
