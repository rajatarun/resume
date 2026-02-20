import { NextRequest, NextResponse } from "next/server";
import { resumeData } from "@/lib/data/resume";
import { getProvider } from "@/lib/providers";
import { buildChunks } from "@/lib/rag/chunking";
import { getPool, upsertChunkEmbedding } from "@/lib/rag/store";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-ingest-secret");
  if (process.env.NODE_ENV === "production" && process.env.INGEST_SECRET && secret !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = getProvider();
  const chunks = buildChunks(resumeData);
  const pool = getPool();

  for (const chunk of chunks) {
    const embedding = await provider.embedText({ text: `${chunk.title}\n${chunk.snippet}` });
    await upsertChunkEmbedding(pool, chunk, embedding);
  }

  await pool.end();
  return NextResponse.json({ ok: true, chunkCount: chunks.length });
}
