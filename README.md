# Tarun Raja – Chatbot Resume (AWS-first)

Production-ready Next.js App Router site with recruiter chat + JD match. Resume UI and RAG both use `lib/data/resume.json` as source of truth.

## Tech
- Next.js 14 + TypeScript + Tailwind + Framer Motion
- API routes: `/api/chat`, `/api/match`, `/api/ingest`
- Default RAG storage: AWS RDS Postgres + `pgvector`
- Provider abstraction: OpenAI (default) or Bedrock switch
- AWS primary hosting: Amplify (Git CI/CD)

## Project structure

```txt
app/
  api/chat/route.ts
  api/match/route.ts
  api/ingest/route.ts
  recruiter/page.tsx
  resume/page.tsx
components/
  hero.tsx
  recruiter-console.tsx
lib/
  data/resume.json
  providers/{openai,bedrock,index,types}.ts
  rag/{chunking,retrieval,store}.ts
  rate-limit/index.ts
scripts/
  parse-resume.ts
  ingest.ts
infra/
  terraform/{main.tf,variables.tf}
  docker-compose.yml
migrations/001_init_pgvector.sql
amplify.yml
```

## Local dev quickstart

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start pgvector locally:
   ```bash
   docker compose -f infra/docker-compose.yml up -d
   ```
3. Create env file:
   ```bash
   cp .env.example .env.local
   ```
4. Run migration:
   ```bash
   psql "$DATABASE_URL" -f migrations/001_init_pgvector.sql
   ```
5. Ingest chunks:
   ```bash
   npm run ingest
   ```
6. Start app:
   ```bash
   npm run dev
   ```

## Resume ingestion from PDF

- Parse a source resume PDF into normalized JSON scaffold:
  ```bash
  npm run parse:resume -- ./Tarun-Raja-Resume.pdf
  ```
- Then manually refine generated sections in `lib/data/resume.json`.

## AWS deployment path (PRIMARY): Amplify + RDS pgvector

### 1) Provision RDS using Terraform

```bash
cd infra/terraform
terraform init
terraform apply -var='db_password=<strong-password>'
```

Copy `database_url` output for Amplify env vars.

### 2) Run DB migration

```bash
psql "<DATABASE_URL_FROM_TERRAFORM_OUTPUT>" -f migrations/001_init_pgvector.sql
```

### 3) Create Amplify app from Git

1. Push this repository to GitHub.
2. AWS Console → Amplify → **New app** → **Host web app**.
3. Connect GitHub repo + branch.
4. Build settings: Amplify auto-detects `amplify.yml`.
5. Add environment variables in Amplify:
   - `LLM_PROVIDER=openai`
   - `OPENAI_API_KEY=...`
   - `VECTOR_STORE=rds`
   - `DATABASE_URL=...`
   - `RATE_LIMIT_WINDOW_MS=60000`
   - `RATE_LIMIT_MAX=30`
   - `INGEST_SECRET=<optional>`
6. Deploy.

### 4) Run ingestion (once)

- Use Amplify branch job with curl call to `/api/ingest` or run locally with production `DATABASE_URL`:

```bash
npm run ingest
```

### 5) Verify endpoints

```bash
curl -X POST https://<amplify-domain>/api/chat -H 'content-type: application/json' -d '{"message":"Summarize Tarun\'s AWS experience","mode":"qa"}'
curl -X POST https://<amplify-domain>/api/match -H 'content-type: application/json' -d '{"jobDescription":"Need senior product engineer with Next.js and AWS"}'
```

## Optional advanced path

- OpenNext/SST + CloudFront/Lambda + RDS: architecture supported by existing provider + route handler separation.

## Security + privacy implemented

- Lightweight IP rate limiting on `/api/chat` and `/api/match`.
- JD text processed per request; not persisted by default.
- “No hallucinations” system prompt forces `Not in resume.` for missing facts.
- Secrets expected from server-side environment variables only.

## Acceptance checks

- Resume pages render from JSON source.
- Chat endpoint returns answer + citations.
- Match endpoint returns structured JSON + citations.
- Ingest endpoint guarded for production with secret.
- Amplify deploy spec included.
