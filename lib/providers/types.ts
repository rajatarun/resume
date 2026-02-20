export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export interface LlmProvider {
  generateChat(input: { messages: ChatMessage[]; temperature?: number }): Promise<string>;
  embedText(input: { text: string }): Promise<number[]>;
}
