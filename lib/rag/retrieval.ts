import { resumeData } from "@/lib/data/resume";
import { buildChunks, type ResumeChunk } from "./chunking";

const chunks = buildChunks(resumeData);

export function retrieveResumeContext(query: string, k = 5): ResumeChunk[] {
  const terms = query.toLowerCase().split(/\W+/).filter(Boolean);
  return [...chunks]
    .map((chunk) => {
      const haystack = `${chunk.title} ${chunk.snippet} ${chunk.tags.join(" ")}`.toLowerCase();
      const score = terms.reduce((acc, term) => acc + (haystack.includes(term) ? 1 : 0), 0);
      return { chunk, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.chunk);
}
