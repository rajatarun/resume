import { resumeData } from "../lib/data/resume";
import { buildChunks } from "../lib/rag/chunking";
import { getProvider } from "../lib/providers";
import { getPool, upsertChunkEmbedding } from "../lib/rag/store";

async function main() {
  const provider = getProvider();
  const pool = getPool();
  const chunks = buildChunks(resumeData);

  for (const chunk of chunks) {
    const embedding = await provider.embedText({ text: `${chunk.title}\n${chunk.snippet}` });
    await upsertChunkEmbedding(pool, chunk, embedding);
    console.log(`Ingested ${chunk.sourceId}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
