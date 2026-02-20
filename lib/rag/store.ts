import { Pool } from "pg";
import type { ResumeChunk } from "./chunking";

export function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required when VECTOR_STORE=rds");
  }
  return new Pool({ connectionString, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined });
}

export async function upsertChunkEmbedding(pool: Pool, chunk: ResumeChunk, embedding: number[]) {
  await pool.query(
    `INSERT INTO resume_chunks (source_id, section, title, company, role, years, tags, snippet, embedding)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (source_id)
     DO UPDATE SET section = EXCLUDED.section, title = EXCLUDED.title, company = EXCLUDED.company,
      role = EXCLUDED.role, years = EXCLUDED.years, tags = EXCLUDED.tags, snippet = EXCLUDED.snippet, embedding = EXCLUDED.embedding`,
    [chunk.sourceId, chunk.section, chunk.title, chunk.company ?? null, chunk.role ?? null, chunk.years ?? null, chunk.tags, chunk.snippet, `[${embedding.join(",")}]`]
  );
}
