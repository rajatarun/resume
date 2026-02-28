export interface ChatRequest {
  question: string;
}

export interface ChatResponse {
  answer: string;
  citations: unknown[];
  timingsMs: Record<string, number>;
  requestId?: string;
}

interface StreamChatOptions {
  timeoutMs?: number;
  onToken?: (token: string) => void;
}

class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const DEFAULT_TIMEOUT_MS = 60_000;

const tryParseJsonObject = (raw: string): unknown => {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Empty response body");
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    // Some integrations append shell-like suffixes (for example, "~ $").
    // Recover by parsing the first complete top-level JSON object.
    let depth = 0;
    let inString = false;
    let escaped = false;
    let objectStart = -1;

    for (let i = 0; i < trimmed.length; i += 1) {
      const char = trimmed[i];

      if (inString) {
        if (escaped) {
          escaped = false;
          continue;
        }

        if (char === "\\") {
          escaped = true;
          continue;
        }

        if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === "{") {
        if (depth === 0) {
          objectStart = i;
        }
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0 && objectStart !== -1) {
          return JSON.parse(trimmed.slice(objectStart, i + 1));
        }
      }
    }

    throw new Error("Unable to parse JSON object from response body");
  }
};

const parseChatResponseFromText = (raw: string, status?: number): ChatResponse => {
  return validateChatResponse(tryParseJsonObject(raw) as Partial<ChatResponse>, status);
};

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as { message?: string; error?: string };
    return payload.message ?? payload.error ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

const validateChatResponse = (data: Partial<ChatResponse>, status?: number): ChatResponse => {
  if (typeof data.answer !== "string" || !Array.isArray(data.citations)) {
    throw new ApiError("Invalid response format from chat API.", status);
  }

  const timingsMs =
    data.timingsMs && typeof data.timingsMs === "object"
      ? (data.timingsMs as Record<string, number>)
      : {};

  return {
    answer: data.answer,
    citations: data.citations,
    timingsMs,
    requestId: typeof data.requestId === "string" ? data.requestId : undefined
  };
};

const getRequestIdFromHeaders = (response: Response): string | undefined => {
  return response.headers.get("x-amzn-requestid") ?? response.headers.get("x-request-id") ?? undefined;
};

const logRequestId = (requestId?: string) => {
  if (requestId) {
    console.info("Chat API requestId:", requestId);
  }
};

export const postChatQuestion = async (
  request: ChatRequest,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ChatResponse> => {
  const endpoint = process.env.NEXT_PUBLIC_CHAT_API;

  if (!endpoint) {
    throw new ApiError("Missing NEXT_PUBLIC_CHAT_API configuration.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new ApiError(await parseErrorMessage(response), response.status);
    }

    const data = parseChatResponseFromText(await response.text(), response.status);
    const requestId = data.requestId ?? getRequestIdFromHeaders(response);
    logRequestId(requestId);

    return {
      ...data,
      requestId
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Chat request timed out. Please try again.");
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError("Unable to reach chat service. Please try again.");
  } finally {
    clearTimeout(timeoutId);
  }
};

export const streamChatQuestion = async (
  request: ChatRequest,
  options: StreamChatOptions = {}
): Promise<ChatResponse> => {
  const endpoint = process.env.NEXT_PUBLIC_CHAT_API;

  if (!endpoint) {
    throw new ApiError("Missing NEXT_PUBLIC_CHAT_API configuration.");
  }

  const { timeoutMs = DEFAULT_TIMEOUT_MS, onToken } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new ApiError(await parseErrorMessage(response), response.status);
    }

    const responseRequestId = getRequestIdFromHeaders(response);
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const data = parseChatResponseFromText(await response.text(), response.status);
      const requestId = data.requestId ?? responseRequestId;
      onToken?.(data.answer);
      logRequestId(requestId);
      return { ...data, requestId };
    }

    const body = response.body;
    if (!body) {
      throw new ApiError("Streaming response body is empty.", response.status);
    }

    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let answer = "";
    let citations: unknown[] = [];
    let timingsMs: Record<string, number> = {};
    let requestId: string | undefined = responseRequestId;

    const appendToken = (token: string) => {
      if (!token) {
        return;
      }
      answer += token;
      onToken?.(token);
    };

    const processDataLine = (dataLine: string) => {
      const trimmed = dataLine.trim();
      if (!trimmed || trimmed === "[DONE]") {
        return;
      }

      try {
        const payload = JSON.parse(trimmed) as Partial<ChatResponse> & {
          token?: string;
          answerDelta?: string;
        };

        if (typeof payload.answerDelta === "string") {
          appendToken(payload.answerDelta);
        } else if (typeof payload.token === "string") {
          appendToken(payload.token);
        } else if (typeof payload.answer === "string") {
          const delta = payload.answer.slice(answer.length);
          appendToken(delta);
        }

        if (Array.isArray(payload.citations)) {
          citations = payload.citations;
        }

        if (payload.timingsMs && typeof payload.timingsMs === "object") {
          timingsMs = payload.timingsMs as Record<string, number>;
        }

        if (typeof payload.requestId === "string") {
          requestId = payload.requestId;
        }
      } catch {
        appendToken(trimmed);
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const rawLine of lines) {
        const line = rawLine.trimEnd();
        if (!line) {
          continue;
        }

        if (line.startsWith("data:")) {
          processDataLine(line.slice(5));
        } else if (!line.startsWith(":")) {
          processDataLine(line);
        }
      }
    }

    buffer += decoder.decode();
    const finalBuffer = buffer.trim();
    if (finalBuffer) {
      if (finalBuffer.startsWith("data:")) {
        processDataLine(finalBuffer.slice(5));
      } else {
        processDataLine(finalBuffer);
      }
    }

    logRequestId(requestId);

    return {
      answer,
      citations,
      timingsMs,
      requestId
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Chat request timed out. Please try again.");
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError("Unable to reach chat service. Please try again.");
  } finally {
    clearTimeout(timeoutId);
  }
};


export interface BlogCard {
  id: string;
  title: string;
  excerpt: string;
  publishedAt?: string;
  url?: string;
  tags: string[];
  status?: string;
}

export interface Source {
  title: string;
  url: string;
  notes?: string;
}

export interface Article {
  id: string;
  title: string;
  tags: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  publishedUrl?: string;
  generated: {
    linkedin_post?: string;
    sources?: Source[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

class BlogApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'BlogApiError';
    this.status = status;
  }
}

const getBlogApiBaseUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error('Missing NEXT_PUBLIC_API_BASE_URL configuration.');
  }
  return baseUrl.replace(/\/$/, '');
};

const assertBrowserRuntime = () => {
  if (typeof window === 'undefined') {
    throw new Error('Blog API helpers must be called from the browser runtime.');
  }
};

const fetchJson = async <T>(path: string): Promise<T> => {
  assertBrowserRuntime();
  const response = await fetch(`${getBlogApiBaseUrl()}${path}`, {
    headers: {
      Accept: 'application/json'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const payload = (await response.json()) as { message?: string; error?: string };
      message = payload.message ?? payload.error ?? message;
    } catch {
      // no-op: keep fallback message for non-JSON responses
    }

    throw new BlogApiError(message, response.status);
  }

  return (await response.json()) as T;
};

export const getBlogCards = async ({
  limit = 50,
  status = 'APPROVED,PUBLISHED'
}: {
  limit?: number;
  status?: string;
} = {}): Promise<{ items: BlogCard[] }> => {
  const searchParams = new URLSearchParams({
    limit: String(limit),
    status
  });

  const payload = await fetchJson<{ items?: BlogCard[] }>(`/site/posts?${searchParams.toString()}`);

  return {
    items: Array.isArray(payload.items) ? payload.items : []
  };
};

export const getArticle = async (id: string): Promise<Article> => {
  return fetchJson<Article>(`/site/posts/${encodeURIComponent(id)}`);
};

export { BlogApiError };
