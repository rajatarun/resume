import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/web3/siwe";

export async function POST() {
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
