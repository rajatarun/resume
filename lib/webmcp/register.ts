import type { WebMcpModelContext, WebMcpRegisterOptions, WebMcpToolDescriptor } from "./types";
import {
  executeGetExperienceEntry,
  executeGetGithubPortfolioProject,
  executeGetResumeProjectDetails,
  executeListPublicSiteSections,
  executeListPublicSkills,
  executeSearchPublicResume,
  executeSuggestPublicNavigation
} from "./handlers";

const READ_ONLY: WebMcpToolDescriptor["annotations"] = {
  readOnlyHint: true,
  consequentialHint: false,
  untrustedContentHint: false
};

export const WEBMCP_PUBLIC_TOOL_NAMES = [
  "search_public_resume",
  "list_public_skills",
  "get_experience_entry",
  "get_resume_project_details",
  "get_github_portfolio_project",
  "list_public_site_sections",
  "suggest_public_navigation"
] as const;

export type WebMcpPublicToolName = (typeof WEBMCP_PUBLIC_TOOL_NAMES)[number];

export function buildPublicWebMcpTools(): WebMcpToolDescriptor[] {
  return [
    {
      name: "search_public_resume",
      title: "Search public résumé",
      description:
        "Keyword search over Tarun Raja's public résumé content (profile, skills, experience, projects). Does not access admin, chat history, or private data.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search terms, e.g. Kubernetes or JP Morgan." },
          limit: { type: "integer", minimum: 1, maximum: 10, description: "Max chunks to return (default 5)." }
        },
        required: ["query"]
      },
      outputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
          matchCount: { type: "integer" },
          matches: { type: "array" }
        }
      },
      annotations: READ_ONLY,
      execute: (input) => executeSearchPublicResume(input)
    },
    {
      name: "list_public_skills",
      title: "List public skills",
      description: "List skill groups and years of experience from the public résumé JSON.",
      inputSchema: {
        type: "object",
        properties: {
          groupName: { type: "string", description: "Optional exact group name, e.g. Backend or AI/LLM." }
        }
      },
      annotations: READ_ONLY,
      execute: (input) => executeListPublicSkills(input)
    },
    {
      name: "get_experience_entry",
      title: "Get experience entry",
      description: "Return one or more public work history entries by index and/or company/role filters.",
      inputSchema: {
        type: "object",
        properties: {
          index: { type: "integer", minimum: 0, description: "Zero-based index in experience list." },
          company: { type: "string", description: "Case-insensitive company substring." },
          role: { type: "string", description: "Case-insensitive job title substring." }
        }
      },
      annotations: READ_ONLY,
      execute: (input) => executeGetExperienceEntry(input)
    },
    {
      name: "get_resume_project_details",
      title: "Get résumé project",
      description: "Details for a featured project listed on the public résumé (data/resume.json).",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Project name, e.g. TaskWeave." }
        },
        required: ["name"]
      },
      annotations: READ_ONLY,
      execute: (input) => executeGetResumeProjectDetails(input)
    },
    {
      name: "get_github_portfolio_project",
      title: "Get GitHub portfolio project",
      description:
        "Read-only metadata for a public GitHub repo from the build-time projects.json cache (portfolio page).",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Repository id/name, e.g. chatbot-resume." }
        },
        required: ["id"]
      },
      annotations: READ_ONLY,
      execute: (input) => executeGetGithubPortfolioProject(input)
    },
    {
      name: "list_public_site_sections",
      title: "List public site sections",
      description: "Enumerate public site areas an agent may suggest linking to (excludes /admin and diagnostics).",
      inputSchema: { type: "object", properties: {} },
      annotations: READ_ONLY,
      execute: () => executeListPublicSiteSections()
    },
    {
      name: "suggest_public_navigation",
      title: "Suggest public navigation",
      description:
        "Return a canonical path and absolute URL for a public section. Does not perform navigation or modify state.",
      inputSchema: {
        type: "object",
        properties: {
          sectionId: {
            type: "string",
            description: "Section id from list_public_site_sections, e.g. resume or portfolio."
          }
        },
        required: ["sectionId"]
      },
      annotations: READ_ONLY,
      execute: (input) => executeSuggestPublicNavigation(input)
    }
  ];
}

/**
 * Register all public tools on a native ModelContext. Uses AbortSignal for cleanup per the spec.
 */
export async function registerPublicWebMcpTools(
  modelContext: WebMcpModelContext,
  options?: WebMcpRegisterOptions
): Promise<void> {
  const tools = buildPublicWebMcpTools();
  await Promise.all(tools.map((tool) => modelContext.registerTool(tool, options)));
}
