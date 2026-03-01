import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const requiredEnv = ["GITHUB_USER", "LINKEDIN_USER"];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const baseUrl = "https://main.d1082kyye5hmz4.amplifyapp.com";
const routes = ["/", "/resume", "/portfolio", "/recruiter", "/labs", "/blog", "/contact"];

const urlTag = (route) => `  <url>\n    <loc>${baseUrl}${route}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${route === "/" ? "1.0" : "0.8"}</priority>\n  </url>`;

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(urlTag).join("\n")}\n</urlset>\n`;

const robotsTxt = `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${baseUrl}/sitemap.xml\n`;

const publicDir = resolve(process.cwd(), "public");
await mkdir(publicDir, { recursive: true });
await writeFile(resolve(publicDir, "sitemap.xml"), sitemapXml, "utf8");
await writeFile(resolve(publicDir, "robots.txt"), robotsTxt, "utf8");

console.log("Generated static SEO files:");
console.log("- public/sitemap.xml");
console.log("- public/robots.txt");
