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
  drafts?: Array<{
    weekly_hook?: {
      topic?: string;
      why_now_2026?: string;
      angle?: string;
    };
    linkedin_post?: string;
    hashtags?: string[];
    sources?: string[];
  }>;
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
  const draftsSource = Array.isArray(value.drafts)
    ? value.drafts
    : Array.isArray(generated.drafts)
      ? generated.drafts
      : [];
  const drafts = Array.isArray(draftsSource)
    ? draftsSource
        .filter(isRecord)
        .map((draft) => {
          const draftWeeklyHook = isRecord(draft.weekly_hook) ? draft.weekly_hook : {};
          return {
            weekly_hook: {
              topic: typeof draftWeeklyHook.topic === "string" ? draftWeeklyHook.topic : undefined,
              why_now_2026: typeof draftWeeklyHook.why_now_2026 === "string" ? draftWeeklyHook.why_now_2026 : undefined,
              angle: typeof draftWeeklyHook.angle === "string" ? draftWeeklyHook.angle : undefined
            },
            linkedin_post: typeof draft.linkedin_post === "string" ? draft.linkedin_post : undefined,
            hashtags: toStringArray(draft.hashtags),
            sources: toStringArray(draft.sources)
          };
        })
    : [];

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
    drafts,
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

export interface Provider {
  name: string;
  display_name: string;
  device_types: string[];
  configured: boolean;
  supports_rename: boolean;
}

export type ProviderRenameStatus = "synced" | "registry_only" | string;

export interface UpdateDeviceResponse {
  device_id: string;
  updated: string[];
  updated_at: string;
  provider_rename?: Record<string, ProviderRenameStatus>;
}
