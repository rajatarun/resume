import type { ModelPricing } from "@/lib/pricing";

export type CostEstimateInput = {
  baseCostUsd: number;
  pricing: ModelPricing;
  inputTokens: number;
  outputCapTokens: number;
};

export type CostEstimateOutput = {
  baseCost: number;
  variableCost: number;
  totalCost: number;
  formatted: {
    baseCost: string;
    variableCost: string;
    totalCost: string;
  };
};

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(4)}`;
}

export function estimateCost({
  baseCostUsd,
  pricing,
  inputTokens,
  outputCapTokens
}: CostEstimateInput): CostEstimateOutput {
  const inputCost = (inputTokens / 1000) * pricing.inputPer1kUsd;
  const outputCost = (outputCapTokens / 1000) * pricing.outputPer1kUsd;
  const variableCost = inputCost + outputCost;
  const totalCost = baseCostUsd + variableCost;

  return {
    baseCost: baseCostUsd,
    variableCost,
    totalCost,
    formatted: {
      baseCost: formatUsd(baseCostUsd),
      variableCost: formatUsd(variableCost),
      totalCost: formatUsd(totalCost)
    }
  };
}
