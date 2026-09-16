// Live directory of every Weave product, sourced from ai-content-orchestrator's
// deploy workflow. That repo's CI already assumes the account-wide deploy
// role and already reads TeamWeave's and SIWE's stack outputs to resolve its
// own deploy parameters (see .github/workflows/deploy.yml,
// "Load shared stack outputs"); scripts/build_platform_manifest.py reuses
// that same access, adds two more best-effort stack lookups, and commits the
// result to docs/platform-manifest.json on every successful deploy to main.
//
// This page fetches that file from raw.githubusercontent.com rather than the
// GitHub Actions API: it's a public repo, the file is plain JSON, and no
// token or server round-trip through this static-exported site is needed --
// the same reasoning the OpenAPI specs below are fetched by.
const MANIFEST_URL =
  'https://raw.githubusercontent.com/rajatarun/ai-content-orchestrator/main/docs/platform-manifest.json';

export type ProductStatus = 'active' | 'archived' | 'reserved';

export type PlatformProduct = {
  name: string;
  repo: string;
  category: string;
  description: string;
  apiBaseUrl: string | null;
  openApiSpecUrl: string | null;
  status: ProductStatus;
};

export type PlatformManifest = {
  generatedAt: string;
  generatedBy: string;
  schemaVersion: number;
  products: PlatformProduct[];
};

// Seeded from the same source data build_platform_manifest.py uses (its
// STATIC_PRODUCTS table), so this page has a complete, correctly-categorized
// directory to render even before the workflow above has run once on main --
// every apiBaseUrl here is deliberately null; only the live fetch ever fills
// those in. Kept in sync by hand is an acceptable cost for a fallback that
// exists to not show a blank page, not to duplicate the source of truth.
const FALLBACK_MANIFEST: PlatformManifest = {
  generatedAt: '',
  generatedBy: 'fallback (live manifest unavailable)',
  schemaVersion: 1,
  products: [
    { name: 'DataDictionary', repo: 'https://github.com/rajatarun/DataDictionary', category: 'Data', description: 'MCP server storing/retrieving API field definitions, with AI-assisted drafts and mcp-observatory-gated writes.', apiBaseUrl: null, openApiSpecUrl: null, status: 'active' },
    { name: 'DeployWeave', repo: 'https://github.com/rajatarun/DeployWeave', category: 'Deploy', description: 'Dynamic model selection, Bedrock agent provisioning, LoRA adapter management, real-time token enforcement.', apiBaseUrl: null, openApiSpecUrl: null, status: 'active' },
    { name: 'TrainWeave', repo: 'https://github.com/rajatarun/TrainWeave', category: 'Deploy', description: 'Ephemeral EC2 Spot LoRA fine-tuning orchestration -- one Lambda, no SageMaker, no idle compute.', apiBaseUrl: null, openApiSpecUrl: null, status: 'active' },
    { name: 'DeviceWeave', repo: 'https://github.com/rajatarun/DeviceWeave', category: 'Execution / Tools', description: 'AI-native execution layer converting human intent into safe, real-time control of physical IoT environments.', apiBaseUrl: null, openApiSpecUrl: 'https://raw.githubusercontent.com/rajatarun/DeviceWeave/main/openapi/deviceweave.yaml', status: 'active' },
    { name: 'ScreenWeave', repo: 'https://github.com/rajatarun/ScreenWeave', category: 'Execution / Tools', description: 'AWS-native website crawling and visual QA platform -- Playwright capture plus a Bedrock-driven anomaly report.', apiBaseUrl: null, openApiSpecUrl: null, status: 'active' },
    { name: 'ToolWeave', repo: 'https://github.com/rajatarun/ToolWeave', category: 'Execution / Tools', description: 'FastMCP server that turns natural-language requests into safe REST API executions from OpenAPI/Swagger specs.', apiBaseUrl: null, openApiSpecUrl: null, status: 'active' },
    { name: 'AuthChain', repo: 'https://github.com/rajatarun/AuthChain', category: 'Security', description: 'Serverless Sign-In With Ethereum (SIWE) gateway issuing JWT sessions, with Bedrock-backed RAG document Q&A.', apiBaseUrl: null, openApiSpecUrl: null, status: 'active' },
    { name: 'CipherWeave', repo: 'https://github.com/rajatarun/CipherWeave', category: 'Security', description: 'Agentic cryptography intelligence layer -- policy-enforced, explainable encryption strategy for AI agents.', apiBaseUrl: null, openApiSpecUrl: null, status: 'active' },
    { name: 'mcp-observatory', repo: 'https://github.com/rajatarun/mcp-observatory', category: 'Security', description: 'The shared propose/commit safety gate: risk-scores a tool call before it runs, used across this platform.', apiBaseUrl: null, openApiSpecUrl: null, status: 'active' },
    { name: 'ContextWeave', repo: 'https://github.com/rajatarun/ContextWeave', category: 'Knowledge / RAG', description: 'AWS-native GraphRAG + CAG knowledge layer: Memgraph expertise graph, pgvector chunks, Neptune-backed adaptive routing.', apiBaseUrl: null, openApiSpecUrl: 'https://raw.githubusercontent.com/rajatarun/ContextWeave/main/openapi/contextweave.yaml', status: 'active' },
    { name: 'ai-content-orchestrator', repo: 'https://github.com/rajatarun/ai-content-orchestrator', category: 'Orchestration', description: 'AWS serverless pipeline: article lifecycle, AI LinkedIn drafts via Gemini, weekly newsletter via SES.', apiBaseUrl: null, openApiSpecUrl: 'https://raw.githubusercontent.com/rajatarun/ai-content-orchestrator/main/openapi/content-orchestrator.yaml', status: 'active' },
    { name: 'RoutineWeave', repo: 'https://github.com/rajatarun/RoutineWeave', category: 'Orchestration', description: 'AI-powered scheduled execution engine -- JSON task prompts run on a cron schedule via Gemini, delivered through SNS.', apiBaseUrl: null, openApiSpecUrl: null, status: 'active' },
    { name: 'TaskWeave', repo: 'https://github.com/rajatarun/TaskWeave', category: 'Orchestration', description: 'Archived. The first JSON-driven agent framework in this portfolio; superseded by TeamWeave.', apiBaseUrl: null, openApiSpecUrl: null, status: 'archived' },
    { name: 'TeamWeave', repo: 'https://github.com/rajatarun/TeamWeave', category: 'Orchestration', description: 'Config-driven multi-agent orchestration platform on AWS using Step Functions, Bedrock, and DynamoDB.', apiBaseUrl: null, openApiSpecUrl: 'https://raw.githubusercontent.com/rajatarun/TeamWeave/main/openapi/teamweave.yaml', status: 'active' },
    { name: 'IntentWeave', repo: 'https://github.com/rajatarun/IntentWeave', category: 'Reserved', description: 'Reserved, not started. Capability lives in DeviceWeave + ToolWeave.', apiBaseUrl: null, openApiSpecUrl: null, status: 'reserved' },
    { name: 'PromptWeave', repo: 'https://github.com/rajatarun/PromptWeave', category: 'Reserved', description: 'Reserved, not started. Capability lives in TeamWeave, RoutineWeave, ai-content-orchestrator.', apiBaseUrl: null, openApiSpecUrl: null, status: 'reserved' },
  ],
};

function isPlatformManifest(value: unknown): value is PlatformManifest {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.products) && typeof v.schemaVersion === 'number';
}

export async function fetchPlatformManifest(): Promise<{ manifest: PlatformManifest; isLive: boolean }> {
  try {
    const response = await fetch(MANIFEST_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`manifest fetch failed: ${response.status}`);
    }
    const data: unknown = await response.json();
    if (!isPlatformManifest(data)) {
      throw new Error('manifest response did not match the expected shape');
    }
    return { manifest: data, isLive: true };
  } catch {
    // The manifest genuinely may not exist yet (this workflow only commits
    // it after its first successful run on main) or the fetch may simply be
    // offline. Either way this page has a real, complete directory to show
    // rather than an error state -- every entry just carries apiBaseUrl: null
    // until the live one is reachable.
    return { manifest: FALLBACK_MANIFEST, isLive: false };
  }
}

export const CATEGORY_ORDER = [
  'Orchestration',
  'Knowledge / RAG',
  'Execution / Tools',
  'Security',
  'Data',
  'Deploy',
  'Reserved',
] as const;
