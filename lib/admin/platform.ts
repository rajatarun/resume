// Live directory of every Weave product, resolved from two sources that
// degrade independently:
//
//   1. This site's own build-time NEXT_PUBLIC_* config (see localApiBases
//      below) -- always present, no network, covers the six products this
//      site already calls from its other tabs.
//   2. ai-content-orchestrator's deploy workflow, which publishes
//      docs/platform-manifest.json with URLs read from real CloudFormation
//      Outputs, including stacks this site has no config for.
//
// (2) wins where it has a value -- a stack output is current, a build-time
// constant is only as fresh as the last Amplify build -- but (1) means the
// page still shows live URLs when (2) is missing entirely, which it will be
// until that workflow has run on main at least once.
//
// The manifest is fetched from raw.githubusercontent.com rather than the
// GitHub Actions API: it's a public repo, the file is plain JSON, and no
// token or server round-trip through this static-exported site is needed --
// the same reasoning the OpenAPI specs are fetched by.
const MANIFEST_URL =
  'https://raw.githubusercontent.com/rajatarun/ai-content-orchestrator/main/docs/platform-manifest.json';

export type ProductStatus = 'active' | 'archived' | 'reserved';

// Where a product's live base URL came from. The distinction matters: a stack
// output is what CloudFormation currently reports, while site-config is what
// this site was *built* against -- the same URL its own admin tabs are
// calling right now, but only as fresh as the last Amplify build.
export type ApiSource = 'stack-output' | 'site-config' | null;

export type PlatformProduct = {
  name: string;
  repo: string;
  category: string;
  description: string;
  apiBaseUrl: string | null;
  openApiSpecUrl: string | null;
  status: ProductStatus;
};

export type ResolvedProduct = PlatformProduct & { apiSource: ApiSource };

// The manifest was solving a problem this site had already solved for itself:
// six of these URLs are sitting in its own build environment, because its
// other admin tabs call them. Those are inlined at build time (Next only
// substitutes literal `process.env.NEXT_PUBLIC_X` reads, never a dynamic
// lookup, so each one is spelled out), need no network, and are already in
// the public client bundle -- showing them on a gated page discloses nothing
// that wasn't already shipped.
//
// This is the floor, not the ceiling: the manifest still wins where it has a
// value, because a stack output is current where a build-time constant is
// only as old as the last deploy of this site. But the page is now useful
// with the manifest missing entirely, which is what it should have been from
// the start.
function usable(value: string | undefined): string | undefined {
  // .env.example ships placeholders like https://<rest-api-id>.execute-api...
  // A build that picked those up should read as "not configured", not as a
  // live URL that happens to 404 for everyone.
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes('<') || !/^https?:\/\//.test(trimmed)) return undefined;
  return trimmed.replace(/\/$/, '');
}

function baseOf(endpoint: string | undefined, suffix: string): string | undefined {
  const url = usable(endpoint);
  if (!url) return undefined;
  return url.endsWith(suffix) ? url.slice(0, -suffix.length) : url;
}

export function localApiBases(): Record<string, string | undefined> {
  return {
    'ai-content-orchestrator':
      usable(process.env.NEXT_PUBLIC_ADMIN_API_BASE) ?? usable(process.env.NEXT_PUBLIC_API_BASE_URL),
    TeamWeave: usable(process.env.NEXT_PUBLIC_AGENT_MANAGEMENT_API_BASE),
    AuthChain: usable(process.env.NEXT_PUBLIC_SIWE_API_BASE),
    DeviceWeave: usable(process.env.NEXT_PUBLIC_DEVICEWEAVE_API_URL),
    RoutineWeave: usable(process.env.NEXT_PUBLIC_ROUTINEWEAVE_API_URL),
    // NEXT_PUBLIC_ABOUT_CHAT_API is a full endpoint (.../prod/query-expertise),
    // which is ContextWeave's -- the About page's chat is ContextWeave.
    ContextWeave: baseOf(process.env.NEXT_PUBLIC_ABOUT_CHAT_API, '/query-expertise'),
  };
}

export function resolveProducts(products: PlatformProduct[]): ResolvedProduct[] {
  const local = localApiBases();
  return products.map((product) => {
    if (product.apiBaseUrl) {
      return { ...product, apiSource: 'stack-output' as const };
    }
    const fromSite = local[product.name];
    return fromSite
      ? { ...product, apiBaseUrl: fromSite, apiSource: 'site-config' as const }
      : { ...product, apiSource: null };
  });
}

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
