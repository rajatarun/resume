// TODO(amplify-static-export): Migrate this API route to AWS Lambda + API Gateway because Next.js static export on Amplify S3 does not support app/api route handlers.
import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/providers";
import { retrieveResumeContext } from "@/lib/rag/retrieval";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const rate = checkRateLimit(`chat:${ip}`);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { message } = await req.json();
  if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });

  const chunks = retrieveResumeContext(message, 5);
  const context = chunks.map((c) => `- [${c.sourceId}] ${c.title}: ${c.snippet}`).join("\n");

  const provider = getProvider();
  const completion = await provider.generateChat({
    messages: [
      {
        role: "system",
        content:
          "You answer only from resume context. If info is absent, reply exactly: Not in resume. Keep concise and recruiter-friendly."
      },
      { role: "user", content: `Question: ${message}\n\nResume Context:\n${context}` }
    ]
  });

  const payload = {
    answer: completion,
    citations: chunks.map((c) => ({ sourceId: c.sourceId, section: c.section, title: c.title, snippet: c.snippet }))
  };

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(JSON.stringify(payload)));
      controller.close();
    }
  });

  return new Response(stream, { headers: { "Content-Type": "application/json" } });
}
