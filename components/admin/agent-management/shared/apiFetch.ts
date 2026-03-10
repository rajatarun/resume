export const API = process.env.NEXT_PUBLIC_AGENT_MANAGEMENT_API_BASE;

if (!API) {
  throw new Error('NEXT_PUBLIC_AGENT_MANAGEMENT_API_BASE is not configured');
}

export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

export type ApiBody =
  | Json
  | FormData
  | URLSearchParams
  | Blob
  | ArrayBuffer
  | string
  | null
  | undefined;

type ApiQuery = Record<string, string | number | boolean | null | undefined>;

export type ApiOptions<TBody extends ApiBody = ApiBody> = {
  method?: string;
  headers?: HeadersInit;
  body?: TBody;
  query?: ApiQuery;
  signal?: AbortSignal;
};

function appendQuery(path: string, query?: ApiQuery): string {
  if (!query) return `${API}${path}`;
  const url = new URL(`${API}${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    url.searchParams.append(key, String(value));
  }
  return url.toString();
}

function isPlainObject(value: unknown): value is Record<string, Json> {
  if (typeof value !== 'object' || value === null) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export async function apiFetch<TResponse>(path: string, options: ApiOptions = {}): Promise<TResponse> {
  const method = options.method?.toUpperCase() ?? 'GET';
  const headers = new Headers(options.headers ?? {});
  if (!headers.has('x-api-key')) {
    headers.set('x-api-key', '4TTffLxI7p7Whkgikvjd64oktvZod8uz5ajvi0S1');
  }
  const requestBody = options.body;
  let body: BodyInit | undefined;

  if (requestBody !== null && requestBody !== undefined && method !== 'GET' && method !== 'HEAD') {
    if (
      typeof requestBody === 'string' ||
      requestBody instanceof FormData ||
      requestBody instanceof URLSearchParams ||
      requestBody instanceof Blob ||
      requestBody instanceof ArrayBuffer
    ) {
      body = requestBody;
    } else if (isPlainObject(requestBody) || Array.isArray(requestBody)) {
      body = JSON.stringify(requestBody);
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
    } else {
      body = JSON.stringify(requestBody);
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
    }
  }

  const response = await fetch(appendQuery(path, options.query), {
    method,
    headers,
    body,
    signal: options.signal,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'error' in data
        ? String((data as { error?: unknown }).error)
        : 'Request failed';
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return data as TResponse;
}
