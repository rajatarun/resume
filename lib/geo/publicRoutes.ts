/**
 * Public indexable routes and crawl restrictions. Keep scripts/seo-routes.mjs in sync
 * (validated in __tests__/geo.test.ts).
 */

export const PRODUCTION_BASE_URL = "https://tarunraja.info" as const;

/** Routes listed in sitemap.xml and llms.txt (no admin or unlisted diagnostics). */
export const PUBLIC_SITEMAP_ROUTES = [
  "/",
  "/resume",
  "/portfolio",
  "/about",
  "/labs",
  "/blog",
  "/contact",
  "/publications",
  "/traveller",
  "/website",
  "/chat"
] as const;

export type PublicSitemapRoute = (typeof PUBLIC_SITEMAP_ROUTES)[number];

export const ROBOTS_DISALLOW_PREFIXES = ["/admin", "/site-health-ea96ed"] as const;

export function isRobotsDisallowedPath(pathname: string): boolean {
  return ROBOTS_DISALLOW_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
