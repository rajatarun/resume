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

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as { message?: string; error?: string };
    return payload.message ?? payload.error ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

const validateChatResponse = (data: Partial<ChatResponse>, status?: number): ChatResponse => {
  if (typeof data.answer !== "string" || !Array.isArray(data.citations) || typeof data.timingsMs !== "object" || data.timingsMs === null) {
    throw new ApiError("Invalid response format from chat API.", status);
  }

  return {
    answer: data.answer,
    citations: data.citations,
    timingsMs: data.timingsMs as Record<string, number>,
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

    const data = validateChatResponse((await response.json()) as Partial<ChatResponse>, response.status);
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
      const data = validateChatResponse((await response.json()) as Partial<ChatResponse>, response.status);
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
