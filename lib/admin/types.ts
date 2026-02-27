export const ARTICLE_STATUSES = [
  "DRAFT",
  "REVISION_REQUESTED",
  "AWAITING_APPROVAL",
  "APPROVED",
  "PUBLISHED",
  "FAILED"
] as const;

export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export type Article = {
  id: string;
  pk?: string;
  sk?: string;
  entityType?: string;
  title: string;
  status: ArticleStatus;
  sourceInputs?: string[];
  tags?: string[];
  updatedAt?: string;
  createdAt?: string;
  generated?: {
    weekly_hook?: {
      topic?: string;
      why_now_2026?: string;
      angle?: string;
    };
    linkedin_post?: string;
    hashtags?: string[];
    sources?: string[];
  };
  publishedAt?: string;
  publishedUrl?: string;
  meta?: {
    version?: number;
    retryCount?: number;
    lastError?: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function normalizeArticle(value: unknown): Article {
  if (!isRecord(value)) {
    throw new Error("Invalid article payload.");
  }

  const generated = isRecord(value.generated) ? value.generated : {};
  const weeklyHook = isRecord(generated.weekly_hook) ? generated.weekly_hook : {};
  const meta = isRecord(value.meta) ? value.meta : {};

  return {
    id: typeof value.id === "string" ? value.id : "",
    pk: typeof value.pk === "string" ? value.pk : undefined,
    sk: typeof value.sk === "string" ? value.sk : undefined,
    entityType: typeof value.entityType === "string" ? value.entityType : undefined,
    title: typeof value.title === "string" ? value.title : "",
    status:
      typeof value.status === "string" && ARTICLE_STATUSES.includes(value.status as ArticleStatus)
        ? (value.status as ArticleStatus)
        : "DRAFT",
    sourceInputs: toStringArray(value.sourceInputs),
    tags: toStringArray(value.tags),
    createdAt: typeof value.createdAt === "string" ? value.createdAt : undefined,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : undefined,
    publishedAt: typeof value.publishedAt === "string" ? value.publishedAt : undefined,
    publishedUrl: typeof value.publishedUrl === "string" ? value.publishedUrl : undefined,
    generated: {
      weekly_hook: {
        topic: typeof weeklyHook.topic === "string" ? weeklyHook.topic : undefined,
        why_now_2026: typeof weeklyHook.why_now_2026 === "string" ? weeklyHook.why_now_2026 : undefined,
        angle: typeof weeklyHook.angle === "string" ? weeklyHook.angle : undefined
      },
      linkedin_post: typeof generated.linkedin_post === "string" ? generated.linkedin_post : undefined,
      hashtags: toStringArray(generated.hashtags),
      sources: toStringArray(generated.sources)
    },
    meta: {
      version: typeof meta.version === "number" ? meta.version : undefined,
      retryCount: typeof meta.retryCount === "number" ? meta.retryCount : undefined,
      lastError: typeof meta.lastError === "string" ? meta.lastError : undefined
    }
  };
}

export function normalizeArticleList(value: unknown): { items: Article[] } {
  if (!isRecord(value)) {
    return { items: [] };
  }
  return { items: Array.isArray(value.items) ? value.items.map(normalizeArticle) : [] };
}

export type AdminEvent = {
  type: string;
  message?: string;
  createdAt?: string;
  payload?: Record<string, unknown>;
};

export type Subscriber = {
  email: string;
  status: string;
  createdAt: string;
};
