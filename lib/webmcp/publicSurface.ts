/**
 * Routes where browser-native WebMCP tools may be registered.
 * Fail closed: admin, diagnostics, and other non-public surfaces are excluded.
 */

const PRIVATE_PATH_PREFIXES = ["/admin", "/site-health-ea96ed"] as const;

/** Path prefixes that must never expose WebMCP tools (exact or nested). */
export const WEBMCP_BLOCKED_PATH_PREFIXES: readonly string[] = PRIVATE_PATH_PREFIXES;

export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "") return "/";
  const withoutQuery = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery;
}

export function isWebMcpPublicSurface(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return !WEBMCP_BLOCKED_PATH_PREFIXES.some(
    (blocked) => path === blocked || path.startsWith(`${blocked}/`)
  );
}

/** Read-only public sections agents may link users to (no admin or auth flows). */
export const PUBLIC_SITE_SECTIONS: ReadonlyArray<{
  id: string;
  title: string;
  path: string;
  description: string;
}> = [
  { id: "home", title: "Home", path: "/", description: "Homepage and primary profile introduction." },
  { id: "about", title: "About", path: "/about", description: "Extended background and narrative." },
  { id: "resume", title: "Resume", path: "/resume", description: "Skills, experience, education, certifications." },
  { id: "portfolio", title: "Portfolio", path: "/portfolio", description: "GitHub project portfolio." },
  { id: "publications", title: "Publications", path: "/publications", description: "Writing and publications." },
  { id: "blog", title: "Blog", path: "/blog", description: "Blog posts." },
  { id: "traveller", title: "Traveller", path: "/traveller", description: "Travel journal and map." },
  { id: "website", title: "Website", path: "/website", description: "How this site is built." },
  { id: "chat", title: "Chat", path: "/chat", description: "Public AI chat about the résumé (user-initiated)." }
];

export function resolvePublicSection(sectionId: string): (typeof PUBLIC_SITE_SECTIONS)[number] | null {
  const key = sectionId.trim().toLowerCase();
  return PUBLIC_SITE_SECTIONS.find((s) => s.id === key) ?? null;
}
