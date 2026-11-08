import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  PRODUCTION_BASE_URL,
  PUBLIC_SITEMAP_ROUTES,
  ROBOTS_DISALLOW_PREFIXES
} from "./seo-routes.mjs";

const requiredEnv = ["GITHUB_USER", "LINKEDIN_USER"];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const baseUrl = PRODUCTION_BASE_URL;
const githubUrl = `https://github.com/${process.env.GITHUB_USER}`;
const linkedInUrl = `https://www.linkedin.com/in/${process.env.LINKEDIN_USER}`;

const urlTag = (route) =>
  `  <url>\n    <loc>${baseUrl}${route}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${route === "/" ? "1.0" : "0.8"}</priority>\n  </url>`;

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PUBLIC_SITEMAP_ROUTES.map(urlTag).join("\n")}\n</urlset>\n`;

const robotsDisallowLines = ROBOTS_DISALLOW_PREFIXES.map((path) => `Disallow: ${path}`).join("\n");
const robotsTxt = `User-agent: *\nAllow: /\n${robotsDisallowLines}\nSitemap: ${baseUrl}/sitemap.xml\n`;

const resume = JSON.parse(readFileSync(resolve("data/resume.json"), "utf8"));
const publicationsSource = readFileSync(resolve("data/publications.ts"), "utf8");
const orcidMatch = publicationsSource.match(/orcid:\s*"([^"]+)"/);
const orcid = orcidMatch?.[1] ?? "";

const llmsTxt = `# ${resume.header.name}

> ${resume.profile.summary}

This file is an informal index for automated summarization tools. It is not a web standard and does not affect HTML metadata.

## Canonical site

- ${baseUrl}

## Public pages

${PUBLIC_SITEMAP_ROUTES.map((route) => `- ${baseUrl}${route === "/" ? "" : route}`).join("\n")}

## Authoritative external profiles

- GitHub: ${githubUrl}
- LinkedIn: ${linkedInUrl}
${orcid ? `- ORCID: https://orcid.org/${orcid}` : ""}

## Grounding note

Facts on this site come from the published résumé at ${baseUrl}/resume and Zenodo preprints at ${baseUrl}/publications. Non-public workspace and diagnostic URLs are excluded from the sitemap.
`;

const publicDir = resolve(process.cwd(), "public");
await mkdir(publicDir, { recursive: true });
await writeFile(resolve(publicDir, "sitemap.xml"), sitemapXml, "utf8");
await writeFile(resolve(publicDir, "robots.txt"), robotsTxt, "utf8");
await writeFile(resolve(publicDir, "llms.txt"), llmsTxt, "utf8");

console.log("Generated static SEO files:");
console.log("- public/sitemap.xml");
console.log("- public/robots.txt");
console.log("- public/llms.txt");
