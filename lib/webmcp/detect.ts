import type { WebMcpModelContext } from "./types";

/**
 * Feature-detect WebMCP per the WebML CG migration note (document first, then legacy navigator).
 * @see https://github.com/angular/angular/issues/68947#issuecomment (Built-in AI Early Preview)
 * @see https://webmachinelearning.github.io/webmcp/ § 4.1 Extensions to Document
 */
export function getBrowserModelContext(doc: Document | undefined): WebMcpModelContext | null {
  if (typeof doc === "undefined") return null;
  const extended = doc as Document & { modelContext?: WebMcpModelContext };
  if (extended.modelContext?.registerTool) {
    return extended.modelContext;
  }
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const legacy = nav as Navigator & {
    modelContext?: WebMcpModelContext & {
      provideContext?: (ctx: { tools: unknown[] }) => void;
    };
  };
  if (legacy?.modelContext?.registerTool) {
    return legacy.modelContext;
  }
  return null;
}

export function isWebMcpSupportedInDocument(doc: Document | undefined): boolean {
  return getBrowserModelContext(doc) !== null;
}
