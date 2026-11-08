"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getBrowserModelContext } from "@/lib/webmcp/detect";
import { registerPublicWebMcpTools } from "@/lib/webmcp/register";
import { isWebMcpPublicSurface } from "@/lib/webmcp/publicSurface";

/**
 * Registers read-only public WebMCP tools when the browser supports document.modelContext.
 * No-op on SSR, unsupported browsers, and blocked routes (/admin, site-health, etc.).
 */
export function WebMcpRegistrar() {
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!isWebMcpPublicSurface(pathname)) return;

    const modelContext = getBrowserModelContext(document);
    if (!modelContext) return;

    const controller = new AbortController();
    registerPublicWebMcpTools(modelContext, { signal: controller.signal }).catch(() => {
      /* Feature may be behind a flag or revoked mid-session; never break the page. */
    });

    return () => {
      controller.abort();
    };
  }, [pathname]);

  return null;
}
