export type Tutorial = {
  id: string;
  title: string;
  description: string;
  pdfUrl: string;
  downloadName: string;
  level: "Beginner" | "Intermediate" | "Advanced";
};

export type TutorialTopic = {
  topic: string;
  description: string;
  tutorials: Tutorial[];
};

export const tutorialTopics: TutorialTopic[] = [
  {
    topic: "AI",
    description:
      "Cloud AI guides covering platform setup, RAG, multi-agent systems, guardrails, and production architecture.",
    tutorials: [
      {
        id: "tut-ai-1",
        title: "Platform Overview & First API Call",
        description:
          "Get started with Cloud AI platforms — understand the landscape and make your first API call.",
        pdfUrl:
          "https://tarun-website-tutorials.s3.us-east-1.amazonaws.com/AI/cloud-ai-guide-1.pdf",
        downloadName: "Platform Overview & First API Call – Tarun Raja.pdf",
        level: "Beginner",
      },
      {
        id: "tut-ai-2",
        title: "RAG on the Cloud",
        description:
          "Build retrieval-augmented generation pipelines using managed cloud vector stores and LLM APIs.",
        pdfUrl:
          "https://tarun-website-tutorials.s3.us-east-1.amazonaws.com/AI/cloud-ai-guide-2.pdf",
        downloadName: "RAG on the Cloud – Tarun Raja.pdf",
        level: "Intermediate",
      },
      {
        id: "tut-ai-3",
        title: "Multi-Agent Orchestration",
        description:
          "Design and coordinate multiple AI agents with tool use, handoffs, and shared memory.",
        pdfUrl:
          "https://tarun-website-tutorials.s3.us-east-1.amazonaws.com/AI/cloud-ai-guide-3.pdf",
        downloadName: "Multi-Agent Orchestration – Tarun Raja.pdf",
        level: "Advanced",
      },
      {
        id: "tut-ai-4",
        title: "Guardrails & Security",
        description:
          "Implement safety layers, input/output filtering, and responsible AI controls in production.",
        pdfUrl:
          "https://tarun-website-tutorials.s3.us-east-1.amazonaws.com/AI/cloud-ai-guide-4.pdf",
        downloadName: "Guardrails & Security – Tarun Raja.pdf",
        level: "Intermediate",
      },
      {
        id: "tut-ai-5",
        title: "Production Architecture Patterns",
        description:
          "Battle-tested patterns for deploying AI systems at scale: latency, cost, observability, and reliability.",
        pdfUrl:
          "https://tarun-website-tutorials.s3.us-east-1.amazonaws.com/AI/cloud-ai-guide-5.pdf",
        downloadName: "Production Architecture Patterns – Tarun Raja.pdf",
        level: "Advanced",
      },
      {
        id: "tut-ai-6",
        title: "Cloud AI Cheat Sheet",
        description:
          "Quick-reference card covering APIs, model comparisons, pricing tiers, and key CLI commands.",
        pdfUrl:
          "https://tarun-website-tutorials.s3.us-east-1.amazonaws.com/AI/cloud-ai-guide-6.pdf",
        downloadName: "Cloud AI Cheat Sheet – Tarun Raja.pdf",
        level: "Beginner",
      },
    ],
  },
  {
    topic: "LLMOps",
    description:
      "End-to-end LLMOps and AIOps tutorials covering observability, scoring, drift detection, cost optimisation, and production hardening using mcp-observatory as the reference implementation.",
    tutorials: [
      {
        id: "tut-llmops-1",
        title: "Vol 1 — From Zero to Observable AI Systems",
        description:
          "A ground-up introduction to LLMOps and AIOps concepts. Covers MCP tool calls, the InvocationWrapperAPI, risk tiers (LOW/MEDIUM/HIGH), and the two-phase propose/commit pattern. Culminates in building a minimal traced pipeline with nonce replay detection.",
        pdfUrl:
          "https://tarun-website-tutorials.s3.amazonaws.com/LLMOps/vol1%20beginner%20llmops%20aiops.pdf",
        downloadName: "LLMOps Vol 1 Beginner – Tarun Raja.pdf",
        level: "Beginner",
      },
      {
        id: "tut-llmops-2",
        title: "Vol 2 — Scoring, Drift Detection & the Wrapper API",
        description:
          "A deep dive into the quantitative machinery behind mcp-observatory. Covers the composite scoring engine (Jaccard instability, numeric variance, prompt drift), HMAC-SHA256 token security, dual-run shadow mode, and production Postgres schema design with analytical SQL for drift alerting.",
        pdfUrl:
          "https://tarun-website-tutorials.s3.amazonaws.com/LLMOps/vol2%20intermediate%20llmops%20aiops.pdf",
        downloadName: "LLMOps Vol 2 Intermediate – Tarun Raja.pdf",
        level: "Intermediate",
      },
      {
        id: "tut-llmops-3",
        title: "Vol 3 — Production Hardening, Cost Ops & CI/CD",
        description:
          "Engineering-focused guide for teams taking AI systems to production. Covers AWS SAM deployment, Step Functions human-in-the-loop approval, token economics and model routing, GitHub Actions eval pipelines, security hardening with Redis rate limiting, and OpenTelemetry integration for Grafana/X-Ray tracing.",
        pdfUrl:
          "https://tarun-website-tutorials.s3.amazonaws.com/LLMOps/vol3%20advanced%20llmops%20aiops.pdf",
        downloadName: "LLMOps Vol 3 Advanced – Tarun Raja.pdf",
        level: "Advanced",
      },
    ],
  },
];
