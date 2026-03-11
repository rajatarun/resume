# Architecture — chatbot-resume

## 1. System Overview

This project is a personal professional website for Tarun Raja that doubles as a systems engineering showcase. The public-facing website is a **Next.js 14 App Router** application compiled as a **fully static export** (`output: "export"`) and deployed to **AWS Amplify** (S3 + CloudFront). Dynamic backend capabilities — AI chat, SIWE authentication, admin workflows, and agent management — are offloaded to external serverless APIs on **AWS Lambda + API Gateway**.

The design philosophy separates static, cacheable public content from mutable, serverless-backed control-plane operations.

---

## 2. Component Descriptions

### 2.1 Static Website (Next.js / Amplify)

The main website shell. All pages are pre-rendered to HTML/CSS/JS at build time and served from S3 via CloudFront.

**Key pages:**

| Route | Description |
|-------|-------------|
| `/` | Home landing with pill navigation cards |
| `/about` | Personal bio |
| `/resume` | Interactive resume view from `data/resume.json` |
| `/portfolio`, `/projects` | GitHub projects (from `public/projects.json`) |
| `/blog` | Blog index — fetches posts at runtime from `NEXT_PUBLIC_API_BASE_URL` |
| `/chat` | AI chatbot — streams from `NEXT_PUBLIC_CHAT_API` (Lambda) |
| `/labs` | AI Labs / Agent Studio with cost-bounded agent runs |
| `/newsletter` | Newsletter subscription (in-memory mock) |
| `/appointment` | Zoom meeting booking link |
| `/recruiter` | SIWE-gated recruiter-only page |
| `/onchain`, `/proof` | Onchain identity and RecruiterPass NFT proof |
| `/admin` | Wallet-gated admin dashboard (content lifecycle, agent management) |
| `/website` | Architecture showcase page (stack + Mermaid diagrams) |

### 2.2 RAG Chat System

The `/chat` page allows visitors to ask questions about Tarun's background. Queries are sent to the Lambda chat endpoint which performs retrieval-augmented generation.

**Components:**
- **`lib/rag/chunking.ts`** — Parses `data/resume.json` into typed `ResumeChunk` objects (profile, experience, skills, projects)
- **`lib/rag/retrieval.ts`** — In-memory keyword scoring retrieval (default mode)
- **`lib/rag/store.ts`** — pgvector upsert helpers (used when `VECTOR_STORE=rds`)
- **`lib/providers/openai.ts`** — OpenAI provider using `gpt-4o-mini` (chat) and `text-embedding-3-small` (embeddings)
- **`lib/providers/bedrock.ts`** — AWS Bedrock stub (scaffolded, throws; not production-ready)
- **`scripts/ingest.ts`** — CLI script to embed and upsert chunks into RDS pgvector
- **`migrations/001_init_pgvector.sql`** — Creates `resume_chunks` table with 1536-dimension vector column and IVFFlat index

### 2.3 Web3 / SIWE Authentication

Wallet-based authentication using Sign-In with Ethereum (EIP-4361). Used to gate the `/recruiter` and `/admin` sections.

**Components:**
- **`components/web3/`** — `ConnectWallet`, `SiweButton`, `WalletIdentity`, `RecruiterGate`, `Web3Provider`
- **`lib/web3/wagmiConfig.ts`** — Wagmi config with Injected, WalletConnect, and Coinbase Wallet connectors for Mainnet + Sepolia
- **`lib/web3/siweNonce.ts`** — Nonce management for SIWE session
- **`lib/siweClient.ts`** — Client calls to `NEXT_PUBLIC_SIWE_API_BASE` (API Gateway endpoints: `/siwe/nonce`, `/siwe/verify`, `/siwe/session`, `/siwe/me`)
- **`lib/recruiterPass.ts`** — ERC721 balance check on Polygon Amoy (`NEXT_PUBLIC_RECRUITER_PASS_CONTRACT_ADDRESS`)
- **`lib/authToken.ts`** — HS256 JWT builder for outbound API authorization headers

### 2.4 Admin Dashboard

A wallet-gated admin UI at `/admin`. Manages content lifecycle (articles: draft → review → published), newsletter subscribers, and agent management.

**API targets:**
- `NEXT_PUBLIC_ADMIN_API_BASE` — REST API for article CRUD
- `NEXT_PUBLIC_AGENT_MANAGEMENT_API_BASE` — REST API for agents, teams, roles, departments

**Components:**
- `components/admin/` — Article form, navigation, confirm/toast UI primitives
- `components/admin/agent-management/` — Agents, Teams, Roles, Departments management tabs
- `lib/admin/api.ts` — Typed fetch wrappers for admin REST endpoints

### 2.5 AI Labs / Agent Studio

The `/labs` page exposes a catalog of specialized AI agents (Tech Writer, Product Owner, Project Manager, Developer, Development Lead). Each agent has a typed profile including system prompt, model, cost estimate, and a dummy Solana wallet balance.

**Components:**
- **`lib/agentsCatalog.ts`** — Agent definitions with system prompts, `baseCostUsd`, `walletAddress`, `balanceSol`
- **`lib/costEstimate.ts`** — Per-run token and USD cost estimation
- **`lib/pricing.ts`** — Model pricing lookup tables
- **`components/labs/`** — `AgentStudioTab`, `ChatPanel`, `AgentList`, `PromptModal`, `HowItWorksModal`

### 2.6 GitHub Projects Sync

Build-time script fetches repository metadata from GitHub's GraphQL API and writes a normalized JSON file. The portfolio pages read this static file — no GitHub API calls happen in the browser.

**Key files:**
- `scripts/sync-github-projects.mjs` — Runs at Amplify prebuild (via `npm run sync:projects`)
- `public/projects.json` — Generated artifact consumed by `/portfolio` and `/projects` pages

### 2.7 Infrastructure

**Local:**
- `infra/docker-compose.yml` — PostgreSQL 16 with pgvector extension for local RAG development

**AWS (Terraform):**
- `infra/terraform/main.tf` — Provisions VPC (`10.50.0.0/16`), two private subnets (AZ-a and AZ-b), RDS security group, and RDS PostgreSQL 16 instance (`db.t4g.micro`, 20GB)
- `infra/terraform/variables.tf` — Input variables: `aws_region`, `db_username`, `db_password`, `allowed_cidrs`

**CI/CD:**
- `amplify.yml` — Amplify build spec: `npm install` → `npm run sync:projects` → `npm run build`; artifacts served from `out/`

---

## 3. Data Flow

### 3.1 Visitor Page Request

```
Browser → CloudFront (edge cache) → S3 (static assets)
        → Next.js hydration
        → Optional: Browser → API Gateway → Lambda (for dynamic data)
```

1. Browser requests any public page.
2. CloudFront serves cached HTML/JS/CSS from S3 (Amplify-managed).
3. React hydrates in the browser.
4. Dynamic data (blog posts, chat responses) is fetched client-side via `NEXT_PUBLIC_*` API Gateway URLs.

### 3.2 AI Chat Request

```
Browser (chat form) → fetch(NEXT_PUBLIC_CHAT_API)
                    → API Gateway (POST /chat)
                    → Lambda
                    → RAG retrieval (pgvector or in-memory)
                    → OpenAI (gpt-4o-mini, streaming)
                    → SSE stream back to browser
```

1. User submits a question in `/chat`.
2. `lib/api.ts:streamChatQuestion` POSTs to `NEXT_PUBLIC_CHAT_API` with JWT auth header.
3. Lambda retrieves relevant resume chunks (keyword or vector similarity).
4. Lambda calls OpenAI with a grounded system prompt and the retrieved context.
5. Response streams back as Server-Sent Events; UI renders tokens incrementally.

### 3.3 SIWE Authentication

```
Browser → Connect Wallet (injected / WalletConnect / Coinbase)
        → POST {SIWE_API_BASE}/siwe/nonce
        → Sign EIP-4361 message in wallet
        → POST {SIWE_API_BASE}/siwe/verify (signature)
        → Receive session token
        → GET {SIWE_API_BASE}/siwe/me (Bearer token)
        → Unlock /recruiter or /admin
```

### 3.4 Build-Time GitHub Sync

```
Amplify build trigger
→ npm run sync:projects (scripts/sync-github-projects.mjs)
→ GitHub GraphQL API (repositories, topics, languages)
→ Normalize → filter forks/archived → map categories
→ Write public/projects.json
→ npm run build (Next.js static export)
→ out/ artifacts → S3 → CloudFront
```

### 3.5 Resume Ingest (RAG)

```
tsx scripts/ingest.ts
→ lib/rag/chunking.ts → parse data/resume.json → ResumeChunk[]
→ lib/providers/openai.ts → embedText() → float[] (1536-dim)
→ lib/rag/store.ts → upsertChunkEmbedding() → INSERT INTO resume_chunks
→ PostgreSQL (pgvector) stores vector + metadata
```

---

## 4. Key Design Decisions

### Static-First Architecture
All public pages are pre-built as static HTML with `output: "export"`. This eliminates cold-start latency for visitors, reduces infrastructure complexity, and allows deployment to pure object storage (S3). Dynamic behavior is achieved through client-side JavaScript calling external APIs.

### Provider Abstraction for LLMs
`lib/providers/index.ts` exposes a `getProvider()` factory controlled by the `LLM_PROVIDER` env var. This allows swapping OpenAI for AWS Bedrock (or any future provider) without changing call sites. The Bedrock implementation is intentionally scaffolded to show the pattern without an AWS credential dependency.

### Dual RAG Modes
The system supports two retrieval backends controlled by `VECTOR_STORE`:
- **`memory`** (default): keyword-based BM25-style scoring over in-memory chunks — zero infrastructure, works in static export
- **`rds`**: pgvector cosine similarity over embedded chunks — requires RDS + OpenAI embeddings, used in the Lambda backend

### Config-Driven Agent System
Agent identities, system prompts, model defaults, and cost parameters are declared in `lib/agentsCatalog.ts` as typed objects. No conditional logic is spread across components. Adding a new agent requires only a new entry in the catalog.

### SIWE for Auth (No OAuth/Cognito)
Wallet-based authentication was chosen to showcase Web3 identity primitives and avoid managing user credentials. The SIWE flow is MVP-level — nonces and sessions are not persisted to a database in the current implementation.

### Build-Time GitHub Sync
GitHub API calls happen only at build time (CI), not in the browser. This keeps the client bundle lightweight, avoids exposing `GITHUB_TOKEN` to visitors, and makes the portfolio page resilient to GitHub API downtime.

### JWT-Based API Authorization
`lib/authToken.ts` generates HS256 JWTs signed with `JWT_TOKEN` (server-side) or passes through `NEXT_PUBLIC_AUTHORIZATION_TOKEN` (client-side). This provides a lightweight authorization layer for API Gateway without Cognito.
