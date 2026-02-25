import type { LabModel } from "@/lib/agentsCatalog";

export type ModelPricing = {
  inputPer1kUsd: number;
  outputPer1kUsd: number;
};

export const pricingByModel: Record<LabModel, ModelPricing> = {
  "gpt-mini": {
    inputPer1kUsd: 0.001,
    outputPer1kUsd: 0.002
  },
  "gpt-small": {
    inputPer1kUsd: 0.0015,
    outputPer1kUsd: 0.003
  },
  "gpt-medium": {
    inputPer1kUsd: 0.0025,
    outputPer1kUsd: 0.005
  }
};
