export type ProofArtifact = {
  id: string;
  title: string;
  summary: string;
  url: string;
  contentHash: string;
};

export async function recordProof(artifact: ProofArtifact): Promise<void> {
  // eslint-disable-next-line no-console
  console.log("[proof] recordProof payload", artifact);
}
