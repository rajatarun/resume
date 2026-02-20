import type { LlmProvider } from "./types";

export class ProviderBedrock implements LlmProvider {
  async generateChat(): Promise<string> {
    throw new Error("Bedrock provider scaffolded. Add AWS SDK credentials and implementation for production use.");
  }

  async embedText(): Promise<number[]> {
    throw new Error("Bedrock embedding integration is optional and not enabled in this starter.");
  }
}
