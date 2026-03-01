import type { MetadataRoute } from "next";
import { baseUrl, seoRoutes } from "@/src/seo/seo.config";

export default function sitemap(): MetadataRoute.Sitemap {
  return seoRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date("2026-01-01"),
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.8
  }));
}
