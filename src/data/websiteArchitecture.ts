export type StackCategory = "cloud_services" | "tools" | "technologies" | "design_patterns" | "pipelines";

export type StackItem = {
  name: string;
  status: "Implemented" | "Planned";
  notes: string;
};

export type StackData = Record<StackCategory, StackItem[]>;

export type ArchitectureSection = {
  id: string;
  title: string;
  body: string[];
  bullets?: string[];
  diagram?: {
    title: string;
    mermaid: string;
  };
};

export const websiteArchitectureStack: StackData = {
  cloud_services: [
    { name: "Amazon S3", status: "Implemented", notes: "Static export artifact target (`out/`) for object hosting." },
    { name: "Amazon CloudFront", status: "Implemented", notes: "Edge delivery + cache for static site distribution." },
    { name: "Amazon Route 53", status: "Planned", notes: "DNS ownership and routing for custom domains when running fully on AWS." },
    { name: "AWS Certificate Manager (ACM)", status: "Planned", notes: "Managed TLS certificates for CloudFront custom domains." },
    { name: "AWS Lambda", status: "Implemented", notes: "Runtime target for SIWE/admin orchestration APIs referenced by client env vars." },
    { name: "Amazon API Gateway", status: "Implemented", notes: "Browser calls to SIWE and admin endpoints using configured API base URLs." },
    { name: "Amazon DynamoDB", status: "Planned", notes: "Preferred store for workflow state, sessions, agents, and usage logs in serverless mode." },
    { name: "Amazon CloudWatch", status: "Planned", notes: "Centralized logs/metrics for Lambda + API Gateway operations." },
    { name: "AWS IAM", status: "Planned", notes: "Least-privilege roles/policies for CI and runtime resources." },
    { name: "AWS WAF", status: "Planned", notes: "Optional perimeter protection for abusive traffic patterns." },
    { name: "API Gateway throttling", status: "Implemented", notes: "Expected control for 429 responses and basic abuse shaping." },
    { name: "AWS Secrets Manager / SSM", status: "Planned", notes: "Secret/config storage for provider tokens and API credentials." }
  ],
  tools: [
    { name: "Next.js 14 App Router", status: "Implemented", notes: "Route composition and static export website shell." },
    { name: "TypeScript", status: "Implemented", notes: "Strict typing across pages, utilities, and shared models." },
    { name: "Tailwind CSS", status: "Implemented", notes: "Design system utility classes and responsive layout." },
    { name: "React Query", status: "Implemented", notes: "Admin dashboard data fetching and mutation state management." },
    { name: "GitHub GraphQL API", status: "Implemented", notes: "Build-time repository ingestion to generate project catalog JSON." },
    { name: "AWS SAM / CloudFormation", status: "Planned", notes: "Infrastructure-as-code path for API/Lambda deployment standardization." }
  ],
  technologies: [
    { name: "SIWE (Sign-In with Ethereum)", status: "Implemented", notes: "Wallet-based session flow for recruiter and admin gating." },
    { name: "Web3 wallet connectors", status: "Implemented", notes: "Injected + WalletConnect + Coinbase connectors in client app." },
    { name: "OpenAI provider abstraction", status: "Implemented", notes: "Provider adapters and model pricing utilities for agent runs." },
    { name: "RAG configuration via env vars", status: "Implemented", notes: "Runtime knobs define retrieval backend and embedding model." },
    { name: "DynamoDB vector layer", status: "Planned", notes: "Future backing store for production-grade RAG indexing and retrieval." }
  ],
  design_patterns: [
    { name: "Config-driven modules", status: "Implemented", notes: "Agents, pricing, and content metadata loaded from local typed catalogs." },
    { name: "Serverless orchestration", status: "Implemented", notes: "Browser-to-API Gateway flow for non-SSR control planes." },
    { name: "Separation of concerns", status: "Implemented", notes: "Static UI rendering stays decoupled from remote workflow APIs." },
    { name: "Idempotent workflow steps", status: "Planned", notes: "State transition guards and retry-safe mutations for admin pipelines." },
    { name: "Policy-as-code guards", status: "Planned", notes: "Codified access and cost guardrails for admin and agent execution." }
  ],
  pipelines: [
    { name: "Build-time GitHub sync", status: "Implemented", notes: "`npm run sync:projects` writes normalized repository data into `public/projects.json`." },
    { name: "Static export deployment", status: "Implemented", notes: "Amplify pipeline builds and publishes `out/` artifacts." },
    { name: "Admin content lifecycle", status: "Implemented", notes: "Draft-to-status updates and moderation metadata via remote admin APIs." },
    { name: "AI generation workflow", status: "Implemented", notes: "Provider calls and output shaping for scripted content generation." },
    { name: "Agent cost boundary tracking", status: "Implemented", notes: "Per-run cost estimation, dummy balances, and execution context in AI Labs." }
  ]
};

export const websiteArchitectureSections: ArchitectureSection[] = [
  {
    id: "overview",
    title: "1) Overview",
    body: [
      "This website is a static-exported professional platform that doubles as a systems showcase. It highlights projects, writing, and proof-of-work while also exposing operational patterns (ingestion, workflow control, and AI orchestration) that are directly relevant to full-stack architecture roles.",
      "The goal is to keep public pages fast and cacheable while delegating mutable workflows to serverless APIs. The result is a recruiter-friendly experience at the UI layer and an engineering-ready control plane behind it."
    ]
  },
  {
    id: "high-level-architecture",
    title: "2) High-Level Architecture",
    body: [
      "The front end is built with Next.js App Router and exported as static assets (`output: export`). Public traffic is served via CloudFront + S3. Dynamic workflows (SIWE, admin, and generation) are accessed from the browser using API Gateway-backed endpoints exposed through environment variables.",
      "No always-on application server is required for the website shell. State-bearing operations are pushed into serverless APIs and durable storage layers."
    ],
    diagram: {
      title: "A) System Context",
      mermaid: `flowchart LR
  Visitor[Visitor Browser] --> CF[CloudFront CDN]
  CF --> S3[S3 Static Site]
  S3 --> UI[Next.js Static UI]

  Admin[Admin Wallet User] --> SIWE[SIWE Sign-In]
  SIWE --> UI
  UI --> APIGW[API Gateway]
  APIGW --> LAMBDA[Lambda Orchestration]
  LAMBDA --> DDB[(DynamoDB State Store)]

  GH[GitHub API] --> GQL[GraphQL Fetch Script]
  GQL --> CACHE[projects.json cache]
  CACHE --> UI

  LLM[External LLM Provider] --> GEN[Generator Lambda]
  GEN --> DDB
  GEN --> S3` }
  },
  {
    id: "core-modules",
    title: "3) Core Modules",
    body: [
      "Static Website & Content: Route-level pages are generated at build time for fast delivery. Content pages remain linkable and SEO-friendly.",
      "GitHub Projects Auto-Ingestion (GraphQL): Build step fetches repositories, normalizes metadata/tags, and emits static JSON consumed by `/projects`.",
      "Admin Workflow Studio (content lifecycle): Wallet-gated admin pages create and track article lifecycle states (draft → review → publish).",
      "AI Pipelines: Provider-backed generation utilities compute content outputs and pricing-aware usage metadata.",
      "AI Labs / Agent Studio: Agent profiles define prompts, model defaults, wallet identity, and dummy cost boundaries for controlled experimentation."
    ],
    diagram: {
      title: "B) Visitor Request Flow",
      mermaid: `sequenceDiagram
  participant B as Browser
  participant C as CloudFront
  participant S as S3
  participant U as Hydrated UI
  participant A as API Gateway (optional)

  B->>C: GET /website
  C->>S: Fetch static asset
  S-->>C: HTML/CSS/JS
  C-->>B: Cached response
  B->>U: Hydrate client app
  U->>A: Fetch runtime data (if needed)
  A-->>U: JSON response`
    }
  },
  {
    id: "aws-services",
    title: "4) AWS Cloud Services Used",
    body: [
      "This architecture intentionally combines static hosting primitives with targeted serverless APIs. Services are categorized below as Implemented vs Planned to keep claims precise."
    ]
  },
  {
    id: "data-model",
    title: "5) Data Model & Storage",
    body: [
      "DynamoDB table model (planned canonical design): workflows, content items, sessions/tokens, agent profiles, and usage logs can share PK/SK patterns for scalable access.",
      "Current project cache strategy (implemented): GitHub repository data is normalized at build time and written to `public/projects.json`, eliminating runtime GitHub calls from the browser.",
      "RAG-related configuration is environment-driven, allowing a vector-backed storage layer to be swapped without route changes."
    ],
    diagram: {
      title: "C) GitHub Projects Flow",
      mermaid: `flowchart TD
  Trigger[Build Trigger or Manual Sync] --> Script[sync-github-projects.mjs]
  Script --> GitHub[GitHub GraphQL API]
  GitHub --> Normalize[Normalize tags/categories]
  Normalize --> Cache[Write public/projects.json]
  Cache --> Render[Projects UI render]
  Render --> Visitor[Visitor sees categorized projects]`
    }
  },
  {
    id: "security",
    title: "6) Security & Abuse Prevention",
    body: [
      "SIWE flow summary: wallet signs nonce challenge; verification endpoint returns session token consumed by recruiter/admin UI gates.",
      "Session/token validation: client attaches bearer token for protected calls; backend validates token/session state before allowing writes.",
      "Rate limiting: API Gateway throttling is assumed baseline (429 handling already wired in client). Optional WAF or DynamoDB token bucket can harden high-risk paths.",
      "Least-privilege IAM: role scopes should isolate read-only public endpoints from mutating admin/generation workflows."
    ],
    diagram: {
      title: "D) Admin Workflow Lifecycle",
      mermaid: `sequenceDiagram
  participant W as Admin Wallet
  participant UI as Admin UI
  participant S as SIWE API
  participant G as API Gateway
  participant L as Lambda Workflow
  participant D as DynamoDB

  W->>S: Sign-in (nonce + signature)
  S-->>UI: Session token
  UI->>G: Create workflow request
  G->>L: Invoke workflow handler
  L->>D: Persist initial state
  L->>L: Run generator step
  L->>D: Store outputs + status updates
  D-->>UI: Workflow status/query results`
    }
  },
  {
    id: "cicd",
    title: "7) CI/CD & Deployment",
    body: [
      "Static export build: CI runs project sync + Next.js build to produce `out/` artifacts.",
      "Deployment: artifacts are uploaded to static hosting (Amplify-managed S3/CloudFront pattern). CloudFront invalidation ensures edge freshness.",
      "API infrastructure: SAM/CloudFormation is the planned standard for repeatable Lambda + API Gateway stacks."
    ]
  },
  {
    id: "observability",
    title: "8) Observability & Reliability",
    body: [
      "CloudWatch logs/metrics (planned): capture API/Lambda latency, error rates, and throttles per workflow type.",
      "Correlation IDs (planned): propagate request IDs from UI to API logs for incident triage.",
      "Retries/backoff (planned but recommended): use bounded exponential backoff for GitHub and LLM provider calls to absorb transient failures."
    ]
  },
  {
    id: "patterns",
    title: "9) Design Patterns Used",
    body: [
      "Config-driven modules: agent/team behavior is loaded from typed data catalogs instead of hard-coded conditionals.",
      "Event-driven/serverless orchestration: workflows are modeled as API-triggered units that can evolve independently.",
      "Separation of concerns: static UI and orchestration APIs are independently deployable.",
      "Idempotent workflow steps: mutation boundaries are designed so retries do not duplicate side effects.",
      "Policy-as-code guards: access/cost boundaries can be enforced centrally rather than per-component."
    ],
    diagram: {
      title: "E) Agent Studio Execution + Cost Boundary",
      mermaid: `flowchart LR
  User[User selects agent] --> Estimate[Estimate tokens and USD cost]
  Estimate --> Check{Within dummy balance?}
  Check -- No --> Block[Block run and show guardrail]
  Check -- Yes --> Deduct[Deduct dummy balance]
  Deduct --> Run[Execute provider call]
  Run --> Log[Store execution log]
  Log --> Return[Return response to UI]`
    }
  },
  {
    id: "tradeoffs",
    title: "10) Tradeoffs & Roadmap",
    body: [
      "Intentional simplifications: lightweight SIWE session handling, public static-first architecture, and dummy balances for Agent Studio keep complexity and cost low.",
      "Hardening roadmap: optional Cognito integration, signed API requests, stronger quota enforcement, and DynamoDB-backed token-bucket controls for abuse resistance.",
      "Operational roadmap: formal IaC for APIs, deeper observability, and stricter workflow idempotency to support larger traffic and multi-admin teams."
    ]
  }
];
