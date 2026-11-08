/**
 * WebMCP public surface: route gating, handler validation, and tool catalog policy.
 * Native browser registration is not exercised here (requires Chromium + flag).
 */

import {
  WEBMCP_BLOCKED_PATH_PREFIXES,
  isWebMcpPublicSurface,
  resolvePublicSection,
  PUBLIC_SITE_SECTIONS
} from "@/lib/webmcp/publicSurface";
import {
  executeGetExperienceEntry,
  executeGetResumeProjectDetails,
  executeListPublicSiteSections,
  executeSearchPublicResume,
  executeSuggestPublicNavigation,
  resetPortfolioProjectCacheForTests
} from "@/lib/webmcp/handlers";
import { WEBMCP_PUBLIC_TOOL_NAMES, buildPublicWebMcpTools } from "@/lib/webmcp/register";
import { getBrowserModelContext } from "@/lib/webmcp/detect";

describe("isWebMcpPublicSurface", () => {
  it("allows ordinary public routes", () => {
    expect(isWebMcpPublicSurface("/")).toBe(true);
    expect(isWebMcpPublicSurface("/resume")).toBe(true);
    expect(isWebMcpPublicSurface("/portfolio")).toBe(true);
    expect(isWebMcpPublicSurface("/admin")).toBe(false);
    expect(isWebMcpPublicSurface("/admin/settings")).toBe(false);
    expect(isWebMcpPublicSurface("/site-health-ea96ed")).toBe(false);
  });

  it("blocks every configured private prefix", () => {
    for (const prefix of WEBMCP_BLOCKED_PATH_PREFIXES) {
      expect(isWebMcpPublicSurface(prefix)).toBe(false);
      expect(isWebMcpPublicSurface(`${prefix}/nested`)).toBe(false);
    }
  });

  it("never lists admin or diagnostics in public sections", () => {
    const ids = PUBLIC_SITE_SECTIONS.map((s) => s.path);
    expect(ids.some((p) => p.startsWith("/admin"))).toBe(false);
    expect(ids).not.toContain("/site-health-ea96ed");
  });
});

describe("public WebMCP handlers", () => {
  beforeEach(() => {
    resetPortfolioProjectCacheForTests();
  });

  it("search_public_resume rejects empty query", () => {
    const out = executeSearchPublicResume({ query: "" });
    expect(out).toMatchObject({ error: { code: "INVALID_INPUT" } });
  });

  it("search_public_resume returns matches for known terms", () => {
    const out = executeSearchPublicResume({ query: "Kubernetes", limit: 3 });
    expect(out).toMatchObject({ query: "Kubernetes", matchCount: expect.any(Number) });
    if (!("matches" in (out as object))) throw new Error("expected matches");
    expect((out as { matches: unknown[] }).matches.length).toBeGreaterThan(0);
  });

  it("get_resume_project_details finds TaskWeave", () => {
    const out = executeGetResumeProjectDetails({ name: "TaskWeave" });
    expect(out).toMatchObject({ project: { name: "TaskWeave" } });
  });

  it("get_experience_entry filters by company", () => {
    const out = executeGetExperienceEntry({ company: "CHASE" });
    expect(out).toMatchObject({ experience: expect.any(Array) });
    const ex = (out as { experience: { company: string }[] }).experience;
    expect(ex.length).toBeGreaterThan(0);
    ex.forEach((e) => expect(e.company.toUpperCase()).toContain("CHASE"));
  });

  it("suggest_public_navigation rejects unknown section", () => {
    const out = executeSuggestPublicNavigation({ sectionId: "admin-secrets" });
    expect(out).toMatchObject({ error: { code: "NOT_FOUND" } });
  });

  it("suggest_public_navigation returns resume path", () => {
    const out = executeSuggestPublicNavigation({ sectionId: "resume" });
    expect(out).toMatchObject({
      sectionId: "resume",
      path: "/resume"
    });
    expect(resolvePublicSection("resume")?.path).toBe("/resume");
  });

  it("list_public_site_sections is stable", () => {
    const out = executeListPublicSiteSections();
    expect((out as { sections: unknown[] }).sections.length).toBe(PUBLIC_SITE_SECTIONS.length);
  });
});

describe("WebMCP tool catalog", () => {
  const tools = buildPublicWebMcpTools();

  it("exports a fixed public tool name list", () => {
    expect(WEBMCP_PUBLIC_TOOL_NAMES.length).toBe(tools.length);
    expect(tools.map((t) => t.name).sort()).toEqual([...WEBMCP_PUBLIC_TOOL_NAMES].sort());
  });

  it("marks every tool read-only with no consequential hint", () => {
    tools.forEach((tool) => {
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(tool.annotations?.consequentialHint).not.toBe(true);
      expect(tool.name).toMatch(/^[a-z][a-z0-9_.-]{0,127}$/);
    });
  });

  it("does not expose admin, finance, or mutation tool names", () => {
    const forbidden = /admin|finance|health|token|upload|purchase|contact|newsletter|subscribe|siwe|wallet/i;
    tools.forEach((tool) => {
      expect(tool.name).not.toMatch(forbidden);
      expect(tool.description).not.toMatch(/ContextWeave|admin API/i);
    });
  });
});

describe("getBrowserModelContext", () => {
  it("returns null without a native API (Node test environment)", () => {
    expect(getBrowserModelContext(undefined)).toBe(null);
  });
});
