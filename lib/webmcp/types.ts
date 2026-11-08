/**
 * Minimal TypeScript shapes for the draft WebMCP API (document.modelContext).
 * Browser-only; not available during SSR or in unsupported browsers.
 *
 * @see https://webmachinelearning.github.io/webmcp/
 */

export type WebMcpToolAnnotations = {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
  consequentialHint?: boolean;
  debugging?: boolean;
};

export type WebMcpToolDescriptor = {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  annotations?: WebMcpToolAnnotations;
  execute: (
    input: Record<string, unknown>,
    options?: { signal?: AbortSignal }
  ) => Promise<unknown> | unknown;
};

export type WebMcpRegisterOptions = {
  signal?: AbortSignal;
  exposedTo?: string[];
};

export type WebMcpModelContext = {
  registerTool: (tool: WebMcpToolDescriptor, options?: WebMcpRegisterOptions) => Promise<void>;
  getTools?: (options?: Record<string, unknown>) => Promise<unknown>;
  executeTool?: (tool: unknown, input?: object, options?: Record<string, unknown>) => Promise<string>;
};
