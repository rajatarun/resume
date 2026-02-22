export interface ChatRequest {
  question: string;
}

export interface ChatResponse {
  answer: string;
  citations: unknown[];
  timingsMs: Record<string, number>;
  requestId?: string;
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

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as { message?: string; error?: string };
    return payload.message ?? payload.error ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
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

    const data = (await response.json()) as Partial<ChatResponse>;

    if (typeof data.answer !== "string" || !Array.isArray(data.citations) || typeof data.timingsMs !== "object" || data.timingsMs === null) {
      throw new ApiError("Invalid response format from chat API.", response.status);
    }

    const requestId = typeof data.requestId === "string"
      ? data.requestId
      : response.headers.get("x-amzn-requestid") ?? response.headers.get("x-request-id") ?? undefined;

    if (requestId) {
      console.info("Chat API requestId:", requestId);
    }

    return {
      answer: data.answer,
      citations: data.citations,
      timingsMs: data.timingsMs as Record<string, number>,
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
