export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function fetchJson<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const base = process.env.NEXT_PUBLIC_ADMIN_API_BASE;
  if (!base) {
    throw new ApiError("NEXT_PUBLIC_ADMIN_API_BASE is not configured.", 500);
  }

  const response = await fetch(`${base}${path}`, {
    method: init?.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    body: init?.body ? JSON.stringify(init.body) : undefined
  });

  let payload: unknown;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    if (response.status === 429) throw new ApiError("Rate limited. Please try again shortly.", 429, payload);
    if (response.status === 403) throw new ApiError("Forbidden / blocked (WAF or CORS).", 403, payload);
    const fallback = `Request failed with status ${response.status}.`;
    const message = typeof payload === "object" && payload && "message" in payload ? String((payload as { message?: unknown }).message) : fallback;
    throw new ApiError(message, response.status, payload);
  }

  return (payload ?? {}) as T;
}
