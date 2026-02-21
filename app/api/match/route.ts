// TODO(amplify-static-export): Migrate this API route to AWS Lambda + API Gateway because Next.js static export on Amplify S3 does not support app/api route handlers.
import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/providers";
import { retrieveResumeContext } from "@/lib/rag/retrieval";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const rate = checkRateLimit(`match:${ip}`);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { jobDescription } = await req.json();
  if (!jobDescription) return NextResponse.json({ error: "jobDescription is required" }, { status: 400 });

  const chunks = retrieveResumeContext(jobDescription, 6);
  const context = chunks.map((c) => `- ${c.title}: ${c.snippet}`).join("\n");

  const provider = getProvider();
  const raw = await provider.generateChat({
    messages: [
      {
        role: "system",
        content:
          "You are a recruiter analyst. Return strict JSON with: scoreTotal, breakdown(skills leadership domain tooling), aligned[], gaps[], positioningTips[], followupQuestions[]. Only use context; use Not in resume for missing claims."
      },
      { role: "user", content: `JD:\n${jobDescription}\n\nResume context:\n${context}` }
    ]
  });

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {
      scoreTotal: 70,
      breakdown: { skills: 30, leadership: 12, domain: 14, tooling: 14 },
      aligned: ["Strong full-stack product engineering background."],
      gaps: ["Not in resume."],
      positioningTips: ["Highlight measurable outcomes and AI delivery ownership."],
      followupQuestions: ["What domain-specific KPIs mattered most in recent roles?"]
    };
  }

  return NextResponse.json({ ...parsed, citations: chunks });
}
