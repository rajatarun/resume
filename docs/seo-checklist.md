# SEO + Recruiter Discoverability Checklist

## Build-time requirements
- [x] `GITHUB_USER` is required and validated at build time.
- [x] `LINKEDIN_USER` is required and validated at build time.
- [x] Build fails with a clear error if either variable is missing.
- [x] Static export is enabled via `next.config.js` with `output: "export"`.

## Metadata coverage
- [x] Central SEO configuration in `src/seo/seo.config.ts`.
- [x] Per-route metadata configured for:
  - `/`
  - `/resume`
  - `/portfolio`
  - `/recruiter`
  - `/labs`
  - `/blog`
  - `/contact`
- [x] OpenGraph and Twitter metadata set from centralized route metadata.

## Structured data
- [x] JSON-LD `Person` schema is injected in the root layout.
- [x] JSON-LD `WebSite` schema is injected in the root layout.
- [x] `sameAs` includes dynamic GitHub and LinkedIn profile URLs from environment variables.

## Crawl controls
- [x] `scripts/generate-seo-files.mjs` generates static `public/sitemap.xml`.
- [x] `scripts/generate-seo-files.mjs` generates static `public/robots.txt`.
- [x] `robots.txt` disallows `/admin` and links the sitemap URL.
- [x] `/admin` includes `<meta name="robots" content="noindex, nofollow" />`.

## Discoverability UX
- [x] Footer includes descriptive social links:
  - `GitHub – Tarun Raja`
  - `LinkedIn – Tarun Raja`
- [x] Home page heading updated to recruiter-facing H1 text.
- [x] Resume, Portfolio, and Recruiter pages use explicit recruiter-friendly H1 text.
