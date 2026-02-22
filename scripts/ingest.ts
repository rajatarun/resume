import { resume } from "../lib/resume";
import { buildChunks } from "../lib/rag/chunking";

async function main() {
  const chunks = buildChunks(resume);
  console.log(`Prepared ${chunks.length} chunks for ingestion.`);
}

main();
