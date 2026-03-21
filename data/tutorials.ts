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
          "https://YOUR_BUCKET.s3.YOUR_REGION.amazonaws.com/pdfs/ai-platform-overview.pdf",
        downloadName: "Platform Overview & First API Call – Tarun Raja.pdf",
        level: "Beginner",
      },
      {
        id: "tut-ai-2",
        title: "RAG on the Cloud",
        description:
          "Build retrieval-augmented generation pipelines using managed cloud vector stores and LLM APIs.",
        pdfUrl:
          "https://YOUR_BUCKET.s3.YOUR_REGION.amazonaws.com/pdfs/ai-rag-cloud.pdf",
        downloadName: "RAG on the Cloud – Tarun Raja.pdf",
        level: "Intermediate",
      },
      {
        id: "tut-ai-3",
        title: "Multi-Agent Orchestration",
        description:
          "Design and coordinate multiple AI agents with tool use, handoffs, and shared memory.",
        pdfUrl:
          "https://YOUR_BUCKET.s3.YOUR_REGION.amazonaws.com/pdfs/ai-multi-agent.pdf",
        downloadName: "Multi-Agent Orchestration – Tarun Raja.pdf",
        level: "Advanced",
      },
      {
        id: "tut-ai-4",
        title: "Guardrails & Security",
        description:
          "Implement safety layers, input/output filtering, and responsible AI controls in production.",
        pdfUrl:
          "https://YOUR_BUCKET.s3.YOUR_REGION.amazonaws.com/pdfs/ai-guardrails-security.pdf",
        downloadName: "Guardrails & Security – Tarun Raja.pdf",
        level: "Intermediate",
      },
      {
        id: "tut-ai-5",
        title: "Production Architecture Patterns",
        description:
          "Battle-tested patterns for deploying AI systems at scale: latency, cost, observability, and reliability.",
        pdfUrl:
          "https://YOUR_BUCKET.s3.YOUR_REGION.amazonaws.com/pdfs/ai-production-patterns.pdf",
        downloadName: "Production Architecture Patterns – Tarun Raja.pdf",
        level: "Advanced",
      },
      {
        id: "tut-ai-6",
        title: "Cloud AI Cheat Sheet",
        description:
          "Quick-reference card covering APIs, model comparisons, pricing tiers, and key CLI commands.",
        pdfUrl:
          "https://YOUR_BUCKET.s3.YOUR_REGION.amazonaws.com/pdfs/ai-cheat-sheet.pdf",
        downloadName: "Cloud AI Cheat Sheet – Tarun Raja.pdf",
        level: "Beginner",
      },
    ],
  },
];
