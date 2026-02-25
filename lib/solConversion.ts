export function usdToSol(usd: number, rate: number): number {
  return usd / rate;
}

export function formatSol(amount: number, decimals = 6): string {
  return `${amount.toFixed(decimals)} SOL`;
}
