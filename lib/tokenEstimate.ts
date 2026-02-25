export function estimateTokens(input: string): number {
  const normalized = input.trim();
  if (!normalized) {
    return 0;
  }

  return Math.ceil(normalized.length / 4);
}
