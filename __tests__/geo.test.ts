import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { publications } from "@/data/publications";
import {
  buildPersonJsonLd,
  buildProfilePageJsonLd,
  buildPublicationsItemListJsonLd
} from "@/lib/geo/jsonLd";
import { publicEntity } from "@/lib/geo/publicEntity";
import { PUBLIC_SITEMAP_ROUTES, PRODUCTION_BASE_URL, ROBOTS_DISALLOW_PREFIXES } from "@/lib/geo/publicRoutes";
import { resume } from "@/lib/resume";
import { routeMetadata } from "@/src/seo/seo.config";

function source(relativePath: string): string {
  return readFileSync(resolve(relativePath), "utf8");
}

describe("public entity consistency", () => {
  it("aligns site title with current résumé role", () => {
    expect(publicEntity.currentTitle).toBe(resume.experience[0]?.title);
    expect(publicEntity.siteTitle).toContain(publicEntity.currentTitle);
    expect(routeMetadata["/"].title).toBe(publicEntity.siteTitle);
  });

  it("uses résumé summary for homepage description", () => {
    expect(routeMetadata["/"].description).toBe(publicEntity.profileHeadline);
  });
});

describe("structured data builders", () => {
  it("Person schema includes ORCID and current employer", () => {
    const person = buildPersonJsonLd() as Record<string, unknown>;
    expect(person["@type"]).toBe("Person");
    expect(person.name).toBe("Tarun Raja");
    expect(person.jobTitle).toBe(publicEntity.currentTitle);
    const sameAs = person.sameAs as string[];
    expect(sameAs).toContain(publicEntity.orcidUrl);
    expect(person.worksFor).toMatchObject({ name: resume.experience[0]?.company });
    expect(person.description).toBe(resume.profile.summary);
  });

  it("ProfilePage references the résumé URL", () => {
    const profile = buildProfilePageJsonLd() as Record<string, unknown>;
    expect(profile["@type"]).toBe("ProfilePage");
    expect(profile.url).toBe(`${PRODUCTION_BASE_URL}/resume`);
    expect(profile.mainEntity).toMatchObject({ "@id": `${PRODUCTION_BASE_URL}/resume#tarun-raja` });
  });

  it("publications ItemList matches catalogue length", () => {
    const list = buildPublicationsItemListJsonLd() as {
      itemListElement: Array<{ item: { sameAs: string[] } }>;
    };
    expect(list.itemListElement.length).toBe(publications.length);
    list.itemListElement.forEach((entry, index) => {
      const pub = publications[index];
      expect(entry.item.sameAs).toContain(pub.recordUrl);
      expect(entry.item.sameAs).toContain(`https://doi.org/${pub.doi}`);
    });
  });
});

describe("crawl controls", () => {
  it("keeps TypeScript and generate-seo routes in sync", () => {
    const mjs = source("scripts/seo-routes.mjs");
    for (const route of PUBLIC_SITEMAP_ROUTES) {
      expect(mjs).toContain(`"${route}"`);
    }
    for (const prefix of ROBOTS_DISALLOW_PREFIXES) {
      expect(mjs).toContain(`"${prefix}"`);
    }
  });

  it("sitemap and robots use production canonical host", () => {
    const routes = source("scripts/seo-routes.mjs");
    const sitemap = source("public/sitemap.xml");
    expect(routes).toContain("tarunraja.info");
    expect(sitemap).toContain("https://tarunraja.info/resume");
    expect(sitemap).not.toContain("amplifyapp.com");
  });

  it("blocks private prefixes only", () => {
    expect(ROBOTS_DISALLOW_PREFIXES).toContain("/admin");
    expect(ROBOTS_DISALLOW_PREFIXES).toContain("/site-health-ea96ed");
    expect(PUBLIC_SITEMAP_ROUTES.some((r) => r.startsWith("/admin"))).toBe(false);
  });
});

describe("llms.txt (optional index)", () => {
  it("generate script emits llms.txt from public data", () => {
    const mjs = source("scripts/generate-seo-files.mjs");
    const llms = source("public/llms.txt");
    expect(mjs).toContain("llms.txt");
    expect(llms).toContain("https://tarunraja.info/resume");
    expect(llms).not.toMatch(/ContextWeave|double-blind|finance/i);
  });
});
