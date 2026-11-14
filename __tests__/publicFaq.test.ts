import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..");

function source(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("public recruiter-facing copy", () => {
  it("does not name mcp-observatory on FAQ or store tutorial blurbs", () => {
    const faq = source("components/FaqQuestions.tsx");
    const tutorials = source("data/tutorials.ts");
    const combined = `${faq}\n${tutorials}`.toLowerCase();
    expect(combined).not.toContain("mcp-observatory");
    expect(combined).not.toMatch(/patent[- ]pending/);
  });
});