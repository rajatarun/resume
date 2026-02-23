import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/web3/siwe";

export async function GET() {
  const session = getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ signedIn: false });
  }

  return NextResponse.json({
    signedIn: true,
    session
  });
}
