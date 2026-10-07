/**
 * The unlisted site-health page (app/site-health-ea96ed): live Lighthouse
 * audits of the deployed site through Google's PageSpeed Insights API, read
 * into what the page shows. Pure functions, so they are testable without a
 * network: build the request, and turn the (large) API response into scores,
 * Core Web Vitals, real-user field data and the audits that failed.
 */
import { HOME_DESIGNS } from "@/lib/featureFlags";

export const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
export const PSI_UI = "https://pagespeed.web.dev/analysis";

export type Strategy = "mobile" | "desktop";
export const STRATEGIES: readonly Strategy[] = ["mobile", "desktop"];

export const CATEGORIES = [
  { id: "performance", label: "Performance" },
  { id: "accessibility", label: "Accessibility (ADA / WCAG)" },
  { id: "best-practices", label: "Best practices" },
  { id: "seo", label: "SEO" }
] as const;
export type CategoryId = (typeof CATEGORIES)[number]["id"];

export interface AuditTarget {
  path: string;
  label: string;
}

/**
 * What can be audited: the given public routes (the page passes the sitemap's
 * list from seo.config), plus each homepage design by its preview URL.
 */
export function buildAuditTargets(routes: readonly string[]): AuditTarget[] {
  return [
    ...routes.map((path) => ({ path, label: path === "/" ? "Home (live design)" : path })),
    ...HOME_DESIGNS.map((design) => ({ path: `/?home=${design.name}`, label: `Home: ${design.label} design` }))
  ];
}

export function buildPsiRequestUrl(url: string, strategy: Strategy, apiKey?: string): string {
  const params = new URLSearchParams({ url, strategy });
  for (const category of CATEGORIES) params.append("category", category.id);
  if (apiKey) params.set("key", apiKey);
  return `${PSI_ENDPOINT}?${params.toString()}`;
}

export function pageSpeedUiUrl(url: string, strategy: Strategy): string {
  return `${PSI_UI}?${new URLSearchParams({ url, form_factor: strategy }).toString()}`;
}

/** Lighthouse's own bands: 90-100 good, 50-89 needs improvement, 0-49 poor. */
export type Band = "good" | "average" | "poor";
export function bandOf(score: number): Band {
  if (score >= 90) return "good";
  if (score >= 50) return "average";
  return "poor";
}

export const LAB_METRICS = [
  { id: "largest-contentful-paint", label: "Largest Contentful Paint", short: "LCP" },
  { id: "total-blocking-time", label: "Total Blocking Time", short: "TBT" },
  { id: "cumulative-layout-shift", label: "Cumulative Layout Shift", short: "CLS" },
  { id: "first-contentful-paint", label: "First Contentful Paint", short: "FCP" },
  { id: "speed-index", label: "Speed Index", short: "SI" }
] as const;

export const FIELD_METRICS = [
  { id: "LARGEST_CONTENTFUL_PAINT_MS", label: "Largest Contentful Paint", unit: "ms" },
  { id: "INTERACTION_TO_NEXT_PAINT", label: "Interaction to Next Paint", unit: "ms" },
  { id: "CUMULATIVE_LAYOUT_SHIFT_SCORE", label: "Cumulative Layout Shift", unit: "cls" },
  { id: "FIRST_CONTENTFUL_PAINT_MS", label: "First Contentful Paint", unit: "ms" },
  { id: "EXPERIMENTAL_TIME_TO_FIRST_BYTE", label: "Time to First Byte", unit: "ms" }
] as const;

export interface LabMetric {
  id: string;
  label: string;
  short: string;
  display: string;
  band: Band;
}

export interface FieldMetric {
  id: string;
  label: string;
  display: string;
  band: Band;
}

export interface FailingAudit {
  id: string;
  title: string;
  display: string;
  /** 0-100, or null for pass/fail checks. */
  score: number | null;
  /** How many elements or resources it flagged, when Lighthouse lists them. */
  items: number;
}

export interface HealthReport {
  url: string;
  strategy: Strategy;
  fetchedAt: string;
  lighthouseVersion: string;
  scores: Record<CategoryId, number | null>;
  lab: LabMetric[];
  /** Real Chrome users (CrUX). Null when Google has too little traffic for this URL and its origin. */
  field: { scope: "page" | "origin"; overall: Band | null; metrics: FieldMetric[] } | null;
  failing: Record<CategoryId, FailingAudit[]>;
}

type Json = Record<string, unknown>;
const obj = (value: unknown): Json => (value && typeof value === "object" ? (value as Json) : {});

const FIELD_BANDS: Record<string, Band> = { FAST: "good", AVERAGE: "average", SLOW: "poor" };

function fieldDisplay(value: number, unit: string): string {
  if (unit === "cls") return (value / 100).toFixed(2);
  return value >= 1000 ? `${(value / 1000).toFixed(1)} s` : `${Math.round(value)} ms`;
}

/** Read a PageSpeed Insights v5 response. Throws if it carries no Lighthouse result. */
export function parsePsiResponse(response: unknown, strategy: Strategy): HealthReport {
  const root = obj(response);
  const lhr = obj(root.lighthouseResult);
  const categories = obj(lhr.categories);
  const audits = obj(lhr.audits);
  if (!Object.keys(categories).length) {
    const message = obj(root.error).message;
    throw new Error(typeof message === "string" ? message : "PageSpeed Insights returned no Lighthouse result.");
  }

  const scores = {} as Record<CategoryId, number | null>;
  const failing = {} as Record<CategoryId, FailingAudit[]>;
  for (const { id } of CATEGORIES) {
    const category = obj(categories[id]);
    scores[id] = typeof category.score === "number" ? Math.round(category.score * 100) : null;

    const refs = Array.isArray(category.auditRefs) ? (category.auditRefs as Json[]) : [];
    failing[id] = refs
      .filter((ref) => ref.group !== "metrics" && ref.group !== "hidden")
      .map((ref) => ({ ref, audit: obj(audits[String(ref.id)]) }))
      .filter(({ audit }) => {
        const mode = audit.scoreDisplayMode;
        if (mode === "manual" || mode === "notApplicable" || mode === "informative" || mode === "error") return false;
        return typeof audit.score === "number" && audit.score < 0.9;
      })
      .map(({ ref, audit }) => ({
        id: String(ref.id),
        title: String(audit.title ?? ref.id),
        display: typeof audit.displayValue === "string" ? audit.displayValue : "",
        score: audit.scoreDisplayMode === "binary" ? null : Math.round((audit.score as number) * 100),
        items: Array.isArray(obj(audit.details).items) ? (obj(audit.details).items as unknown[]).length : 0
      }))
      // Pass/fail checks first (they are definite failures), then the lowest scores.
      .sort((a, b) => (a.score ?? -1) - (b.score ?? -1));
  }

  const lab: LabMetric[] = LAB_METRICS.map((metric) => {
    const audit = obj(audits[metric.id]);
    const score = typeof audit.score === "number" ? audit.score * 100 : 0;
    return { ...metric, display: String(audit.displayValue ?? "–"), band: bandOf(score) };
  });

  let field: HealthReport["field"] = null;
  for (const [key, scope] of [
    ["loadingExperience", "page"],
    ["originLoadingExperience", "origin"]
  ] as const) {
    const experience = obj(root[key]);
    const metrics = obj(experience.metrics);
    // PSI copies origin data into loadingExperience when the page has too
    // little of its own; origin_fallback says so.
    if (!Object.keys(metrics).length) continue;
    const actualScope = key === "loadingExperience" && experience.origin_fallback ? "origin" : scope;
    field = {
      scope: actualScope,
      overall: FIELD_BANDS[String(experience.overall_category)] ?? null,
      metrics: FIELD_METRICS.flatMap((metric) => {
        const m = obj(metrics[metric.id]);
        if (typeof m.percentile !== "number") return [];
        return [{ id: metric.id, label: metric.label, display: fieldDisplay(m.percentile, metric.unit), band: FIELD_BANDS[String(m.category)] ?? "average" }];
      })
    };
    break;
  }

  return {
    url: String(lhr.finalDisplayedUrl ?? lhr.finalUrl ?? lhr.requestedUrl ?? obj(root).id ?? ""),
    strategy,
    fetchedAt: String(lhr.fetchTime ?? new Date().toISOString()),
    lighthouseVersion: String(lhr.lighthouseVersion ?? ""),
    scores,
    lab,
    field,
    failing
  };
}
