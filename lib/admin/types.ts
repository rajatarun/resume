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
};

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

function isArticleStatus(value: unknown): value is ArticleStatus {
  return typeof value === "string" && ARTICLE_STATUSES.includes(value as ArticleStatus);
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const normalized = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeArticle(value: unknown): Article | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const id = typeof item.id === "string" && item.id ? item.id : typeof item.sk === "string" && item.sk ? item.sk : null;
  if (!id) return null;

  return {
    id,
    title: typeof item.title === "string" && item.title.trim() ? item.title : "Untitled",
    status: isArticleStatus(item.status) ? item.status : "DRAFT",
    sourceInputs: asStringArray(item.sourceInputs),
    tags: asStringArray(item.tags),
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : undefined,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : undefined,
    generated: item.generated && typeof item.generated === "object" ? (item.generated as Article["generated"]) : undefined,
    publishedAt: typeof item.publishedAt === "string" ? item.publishedAt : undefined,
    publishedUrl: typeof item.publishedUrl === "string" ? item.publishedUrl : undefined
  };
}

export function normalizeArticleListResponse(payload: unknown): { items: Article[] } {
  const candidates = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown }).items)
      ? ((payload as { items: unknown[] }).items ?? [])
      : [];

  const items = candidates
    .map(normalizeArticle)
    .filter((item): item is Article => Boolean(item))
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));

  return { items };
}
