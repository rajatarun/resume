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
