import { NextResponse } from "next/server";
import { isValidEmail } from "@/lib/utils/validation";

const subscribers = new Set<string>();

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();

  if (!isValidEmail(email)) {
    return NextResponse.json({ message: "Please provide a valid email address." }, { status: 400 });
  }

  subscribers.add(email);

  // TODO: Replace in-memory storage with a real email provider integration (e.g., Mailchimp or ConvertKit).
  return NextResponse.json({ message: `Subscribed successfully. Total subscribers in memory: ${subscribers.size}.` });
}
