import OpenAI from "openai";
import type { LlmProvider } from "./types";

export class ProviderOpenAI implements LlmProvider {
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async generateChat({ messages, temperature = 0.2 }: Parameters<LlmProvider["generateChat"]>[0]) {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature,
      messages
    });
    return response.choices[0]?.message?.content ?? "Not in resume.";
  }

  async embedText({ text }: { text: string }) {
    const response = await this.client.embeddings.create({
      model: "text-embedding-3-small",
      input: text
    });
    return response.data[0]?.embedding ?? [];
  }
}
