import type { LlmProvider } from "./types";
import { ProviderBedrock } from "./bedrock";
import { ProviderOpenAI } from "./openai";

export function getProvider(): LlmProvider {
  return process.env.LLM_PROVIDER === "bedrock" ? new ProviderBedrock() : new ProviderOpenAI();
}
