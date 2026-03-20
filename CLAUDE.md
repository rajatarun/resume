# CLAUDE.md — chatbot-resume

Tarun Raja's personal professional website built with Next.js 14 App Router, TypeScript, and TailwindCSS. The site is statically exported and deployed to AWS Amplify (S3 + CloudFront). Backend APIs (chat RAG, SIWE auth, admin, agent management) run on AWS Lambda + API Gateway.

---

## Key Commands

```bash
# Development
npm install              # Install dependencies
npm run dev              # Start local dev server (localhost:3000)

# Build & production
npm run build            # Static export → out/
npm run start            # Serve production build

# Pre-build data sync (runs automatically in prebuild hook)
npm run sync:projects    # Fetch GitHub repos → public/projects.json

# Resume ingest (populate pgvector embeddings)
npm run ingest           # tsx scripts/ingest.ts — requires DATABASE_URL + OPENAI_API_KEY

# Code quality
npm run lint             # ESLint
npm run lint:fix         # ESLint with auto-fix
npm run typecheck        # tsc --noEmit
npm run format           # Prettier write
npm run format:check     # Prettier check
```

---

## Architecture Summary

```
Browser → CloudFront → S3 (static Next.js export)
Browser → API Gateway → Lambda (chat RAG, SIWE, admin)
Browser → OpenAI (via Lambda proxy)
Build    → GitHub GraphQL → public/projects.json
Local    → Docker pgvector (postgres:16 with vector extension)
Prod     → AWS RDS PostgreSQL 16 (db.t4g.micro in private VPC)
```

- **Frontend**: Next.js 14 App Router, `output: "export"`, TailwindCSS, Framer Motion
- **LLM**: OpenAI provider (`gpt-4o-mini` for chat, `text-embedding-3-small` for embeddings). AWS Bedrock scaffolded but not implemented.
- **RAG**: Keyword-based in-memory retrieval (default) or pgvector semantic search (when `VECTOR_STORE=rds` + `DATABASE_URL` set)
- **Auth**: SIWE (Sign-In with Ethereum) via API Gateway. ERC721 RecruiterPass NFT check on Polygon Amoy.
- **CI/CD**: AWS Amplify — runs `sync:projects` then `next build`, publishes `out/`
- **Infrastructure**: Terraform in `infra/terraform/` provisions VPC, private subnets, RDS instance, and security groups
- **Accessibility**: WCAG 2.1 AA / WAI-ARIA 1.1 — skip link, `aria-current` nav, focus trap hook, dialog ARIA contract, tab arrow-key navigation, ARIA live regions for chat

---

## Important Files and Their Roles

| Path | Role |
|------|------|
| `app/` | Next.js App Router pages and layouts |
| `app/chat/page.tsx` | AI chat UI — streams from `NEXT_PUBLIC_CHAT_API` |
| `app/labs/page.tsx` | AI Labs / Agent Studio UI |
| `app/admin/` | Admin dashboard — wallet-gated, calls `NEXT_PUBLIC_ADMIN_API_BASE` |
| `app/api/newsletter/route.ts` | In-memory newsletter subscription endpoint |
| `lib/api.ts` | Client-side fetch wrappers for chat, blog, admin APIs |
| `lib/authToken.ts` | JWT (HS256) builder for API authorization headers |
| `lib/providers/` | LLM provider abstraction (`openai.ts`, `bedrock.ts`, `index.ts`) |
| `lib/rag/chunking.ts` | Breaks `resume.json` into searchable chunks |
| `lib/rag/retrieval.ts` | Keyword-based in-memory RAG retrieval |
| `lib/rag/store.ts` | pgvector upsert helpers for embedding-backed RAG |
| `lib/agentsCatalog.ts` | Typed agent definitions (prompts, model, cost, wallet) |
| `lib/recruiterPass.ts` | ERC721 balance check for RecruiterPass NFT gate |
| `lib/web3/wagmiConfig.ts` | Wagmi config (Mainnet + Sepolia, WalletConnect, Coinbase) |
| `data/resume.json` | Source of truth for resume data (experience, skills, projects, `yearsExp` per skill group) |
| `data/resume.schema.json` | JSON Schema for resume.json validation |
| `src/data/websiteArchitecture.ts` | Architecture stack data and Mermaid diagrams for `/website` page |
| `components/SkillDepthChart.tsx` | Animated bar chart — Framer Motion staggered bars, height = `yearsExp`, shows engineering breadth & depth |
| `components/SkipLink.tsx` | Skip-to-main-content link for keyboard/screen reader users (ADA) |
| `hooks/useFocusTrap.ts` | Zero-dependency focus trap hook — traps Tab/Shift-Tab in open modals, restores focus on close (ADA) |
| `docs/architecture.md` | Full architecture reference including design patterns and ADA accessibility patterns |
| `infra/docker-compose.yml` | Local pgvector container (postgres 16 + vector extension) |
| `infra/terraform/main.tf` | AWS VPC, subnets, RDS instance provisioning |
| `migrations/001_init_pgvector.sql` | DB schema: `resume_chunks` table with ivfflat index |
| `amplify.yml` | Amplify build spec (npm install → sync:projects → next build) |
| `scripts/sync-github-projects.mjs` | Fetches GitHub repos via GraphQL → `public/projects.json` |
| `scripts/ingest.ts` | Embeds resume chunks and upserts into pgvector |
| `public/projects.json` | Generated at build time — never fetched from GitHub at runtime |

---

## Environment Variables

Copy `.env.example` → `.env.local` before running locally.

### Required for chat
| Variable | Description |
|----------|-------------|
| `LLM_PROVIDER` | `openai` (default) or `bedrock` |
| `OPENAI_API_KEY` | OpenAI API key |
| `NEXT_PUBLIC_CHAT_API` | URL of the Lambda chat endpoint (API Gateway) |

### Required for RAG with pgvector
| Variable | Description |
|----------|-------------|
| `VECTOR_STORE` | Set to `rds` to use pgvector instead of in-memory |
| `DATABASE_URL` | PostgreSQL connection string (e.g. `postgresql://resume:resume@localhost:5432/resume`) |
| `INGEST_SECRET` | Auth token for the ingest endpoint |

### Required for Web3 / SIWE
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SIWE_API_BASE` | API Gateway base URL for SIWE nonce/verify/session endpoints |
| `NEXT_PUBLIC_RPC_URL` | JSON-RPC URL (Alchemy Polygon Amoy for RecruiterPass checks) |
| `NEXT_PUBLIC_CHAIN_ID` | Chain ID (80002 = Polygon Amoy) |
| `NEXT_PUBLIC_RECRUITER_PASS_CONTRACT_ADDRESS` | ERC721 contract for RecruiterPass NFT |
| `SIWE_DOMAIN` | Domain for SIWE message (e.g. `localhost:3000`) |
| `SIWE_SESSION_SECRET` | Long random secret for session HMAC |
| `WALLETCONNECT_PROJECT_ID` | WalletConnect v2 project ID |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Same value, exposed to client |

### Required for admin
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_ADMIN_API_BASE` | API Gateway base URL for admin endpoints |
| `NEXT_PUBLIC_AGENT_MANAGEMENT_API_BASE` | API Gateway base URL for agent management |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for blog API (`/site/posts`) |

### Build-time only (Amplify env vars)
| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | Fine-grained PAT with read-only repo metadata access |
| `GITHUB_USER` | GitHub username for project sync |

### AWS
| Variable | Description |
|----------|-------------|
| `AWS_REGION` | AWS region (default `ap-south-1`) |

---

## Gotchas and Known Issues

1. **Static export limitation**: `next.config.js` sets `output: "export"`, so API routes that rely on Next.js server runtime won't work after build. The chat endpoint is an external Lambda.

2. **Newsletter is in-memory only**: `app/api/newsletter/route.ts` stores emails in a `Set<string>` that resets on every deploy. The TODO comment notes Mailchimp/ConvertKit integration is needed for production.

3. **SIWE is MVP-level**: Session nonce and token are not persisted to a database. Replay protection and session revocation are incomplete — see TODO comments in `lib/web3/`.

4. **Bedrock provider is scaffolded**: `lib/providers/bedrock.ts` throws `Error` for both `generateChat` and `embedText`. It is not usable in production.

5. **API key hardcoded in `lib/api.ts`**: The `x-api-key` header value `aUzjadBOca1GEWrlrM1cGIoGhpcEPZ6aEL2ZHavg` appears literal in both `postChatQuestion` and `streamChatQuestion`. This should be moved to an environment variable before any sensitive backend is attached.

6. **`wagmiConfig.ts` uses Mainnet + Sepolia** but `.env.example` sets `NEXT_PUBLIC_CHAIN_ID=80002` (Polygon Amoy). The RecruiterPass check uses the env-var chain while the wallet connector is configured for Mainnet/Sepolia — these are different chains.

7. **pgvector IVFFlat index requires `ANALYZE`**: After ingest, run `ANALYZE resume_chunks;` so the index is used by the planner.

8. **`public/projects.json` must be generated before build**: If `GITHUB_TOKEN` is missing or the API call fails, the file will be stale or missing. The build step will succeed but `/projects` will show no data.

9. **Rate limiting is client-side only**: `lib/rate-limit/` is a client-side utility. API Gateway throttling is the actual server-side guard.

10. **Terraform RDS is publicly accessible**: `publicly_accessible = true` in `infra/terraform/main.tf` — intended for development convenience. Lock this down before production use.
