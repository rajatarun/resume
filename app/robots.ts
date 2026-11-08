import type { MetadataRoute } from "next";
import { ROBOTS_DISALLOW_PREFIXES } from "@/lib/geo/publicRoutes";
import { baseUrl } from "@/src/seo/seo.config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...ROBOTS_DISALLOW_PREFIXES]
    },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
