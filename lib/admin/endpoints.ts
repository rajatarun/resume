/**
 * The endpoint catalogue behind the Platform console.
 *
 * This replaces an embedded Swagger UI. Swagger renders one generic
 * try-it-out form for every operation and hands back a JSON blob; what an
 * operator actually needs is a form that knows a status is an enum of six
 * values and an id is a path parameter, and a response rendered as the thing
 * it is. So the parameters are declared here, typed, and the console builds
 * a real form from them.
 *
 * The other half: a write does not fire. `write: true` endpoints are staged
 * at the gate and committed separately, exactly as they are in the UI — a
 * console that skipped the gate would be a way around the gate.
 */
import { ApiError, fetchJson } from '@/lib/admin/api';

export type ParamKind = 'string' | 'enum' | 'integer' | 'text';
export type ParamIn = 'query' | 'path' | 'body';

export interface EndpointParam {
  name: string;
  in: ParamIn;
  kind: ParamKind;
  required?: boolean;
  options?: readonly string[];
  initial?: string;
}

/** Which service answers, and therefore which base URL and credentials apply. */
export type Product = 'ai-content-orchestrator' | 'ContextWeave' | 'TeamWeave';

export interface Endpoint {
  id: string;
  product: Product;
  method: 'GET' | 'POST';
  /** Path template. `{name}` segments are filled from path params. */
  path: string;
  summary: string;
  params: readonly EndpointParam[];
  /** True when calling it changes something, and so must pass the gate first. */
  write: boolean;
  /** How to draw the response. `json` is the honest fallback. */
  render: 'articles' | 'answer' | 'json';
}

export const ENDPOINTS: readonly Endpoint[] = [
  {
    id: 'articles-list',
    product: 'ai-content-orchestrator',
    method: 'GET',
    path: '/admin/articles',
    summary: 'List articles by status, from the StatusUpdatedIndex GSI.',
    write: false,
    render: 'articles',
    params: [
      {
        name: 'status',
        in: 'query',
        kind: 'enum',
        required: true,
        initial: 'AWAITING_APPROVAL',
        options: ['DRAFT', 'REVISION_REQUESTED', 'AWAITING_APPROVAL', 'APPROVED', 'PUBLISHED', 'FAILED'],
      },
      { name: 'limit', in: 'query', kind: 'integer', initial: '20' },
    ],
  },
  {
    id: 'article-action',
    product: 'ai-content-orchestrator',
    method: 'POST',
    path: '/admin/articles/{id}/actions/{action}',
    summary: 'Every lifecycle transition. Goes through the gate, not straight to the API.',
    write: true,
    render: 'json',
    params: [
      { name: 'id', in: 'path', kind: 'string', required: true },
      {
        name: 'action',
        in: 'path',
        kind: 'enum',
        required: true,
        initial: 'approve',
        options: ['generate', 'submit-for-approval', 'request-edits', 'approve', 'mark-failed', 'archive', 'reject'],
      },
      { name: 'note', in: 'body', kind: 'text' },
    ],
  },
  {
    id: 'subscribers-list',
    product: 'ai-content-orchestrator',
    method: 'GET',
    path: '/admin/subscribers',
    summary: 'Newsletter subscribers.',
    write: false,
    render: 'json',
    params: [],
  },
  {
    id: 'query-expertise',
    product: 'ContextWeave',
    method: 'POST',
    path: '/query-expertise',
    summary: 'Ask the knowledge layer. Returns the answer, its sources and the routing decision.',
    // A read, despite the verb: it answers a question and writes nothing an
    // operator has to approve.
    write: false,
    render: 'answer',
    params: [
      { name: 'question', in: 'body', kind: 'text', required: true },
      { name: 'topK', in: 'body', kind: 'integer', initial: '6' },
    ],
  },
  {
    id: 'observability',
    product: 'TeamWeave',
    method: 'GET',
    path: '/observability',
    summary: 'Span metrics, ContextWeave routing health and the decision log, in one call.',
    write: false,
    render: 'json',
    params: [],
  },
];

export function endpointsByProduct(): Array<{ product: Product; endpoints: Endpoint[] }> {
  const order: Product[] = ['ai-content-orchestrator', 'ContextWeave', 'TeamWeave'];
  return order.map((product) => ({
    product,
    endpoints: ENDPOINTS.filter((e) => e.product === product),
  }));
}

/**
 * Where each product answers. The admin base is handled by fetchJson; the
 * other two come from this site's own build config, which is also what the
 * Platform directory reads.
 */
export function baseUrlFor(product: Product): string | undefined {
  if (product === 'ai-content-orchestrator') return process.env.NEXT_PUBLIC_ADMIN_API_BASE;
  if (product === 'TeamWeave') return process.env.NEXT_PUBLIC_AGENT_MANAGEMENT_API_BASE;
  // NEXT_PUBLIC_ABOUT_CHAT_API is the full /query-expertise endpoint, so the
  // base is that minus the path. Treating it as a base would produce a URL
  // that 404s for every other ContextWeave route.
  const chat = process.env.NEXT_PUBLIC_ABOUT_CHAT_API;
  if (!chat) return undefined;
  return chat.endsWith('/query-expertise') ? chat.slice(0, -'/query-expertise'.length) : chat;
}

export interface CallResult {
  status: number;
  ms: number;
  url: string;
  body: unknown;
  error?: string;
}

/** Build the request path with path params substituted and query appended. */
export function resolvePath(endpoint: Endpoint, values: Record<string, string>): string {
  let path = endpoint.path;
  for (const param of endpoint.params) {
    if (param.in === 'path') {
      path = path.replace(`{${param.name}}`, encodeURIComponent(values[param.name] ?? ''));
    }
  }
  const query = endpoint.params
    .filter((p) => p.in === 'query' && (values[p.name] ?? '') !== '')
    .map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(values[p.name])}`)
    .join('&');
  return query ? `${path}?${query}` : path;
}

function buildBody(endpoint: Endpoint, values: Record<string, string>): Record<string, unknown> | undefined {
  const entries = endpoint.params.filter((p) => p.in === 'body' && (values[p.name] ?? '') !== '');
  if (entries.length === 0) return undefined;
  const body: Record<string, unknown> = {};
  for (const param of entries) {
    body[param.name] = param.kind === 'integer' ? Number(values[param.name]) : values[param.name];
  }
  return body;
}

export async function callEndpoint(endpoint: Endpoint, values: Record<string, string>): Promise<CallResult> {
  const path = resolvePath(endpoint, values);
  const body = buildBody(endpoint, values);
  const base = baseUrlFor(endpoint.product);
  const url = `${base ?? '(base not configured)'}${path}`;
  const started = Date.now();

  if (!base) {
    return {
      status: 0,
      ms: 0,
      url,
      body: null,
      error: `No base URL configured for ${endpoint.product}.`,
    };
  }

  // The admin product goes through fetchJson so it inherits the same API key
  // and SIWE authorization header the rest of the admin uses, rather than this
  // module growing its own copy of them.
  if (endpoint.product === 'ai-content-orchestrator') {
    try {
      const payload = await fetchJson<unknown>(path, { method: endpoint.method, body });
      return { status: 200, ms: Date.now() - started, url, body: payload };
    } catch (err) {
      if (err instanceof ApiError) {
        return { status: err.status, ms: Date.now() - started, url, body: err.details ?? null, error: err.message };
      }
      return {
        status: 0,
        ms: Date.now() - started,
        url,
        body: null,
        error: err instanceof Error ? err.message : 'Request failed',
      };
    }
  }

  try {
    const response = await fetch(url, {
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }
    return {
      status: response.status,
      ms: Date.now() - started,
      url,
      body: payload,
      error: response.ok ? undefined : `Request failed with status ${response.status}.`,
    };
  } catch (err) {
    return {
      status: 0,
      ms: Date.now() - started,
      url,
      body: null,
      error: err instanceof Error ? err.message : 'Request failed',
    };
  }
}

export function initialValues(endpoint: Endpoint): Record<string, string> {
  const values: Record<string, string> = {};
  for (const param of endpoint.params) {
    values[param.name] = param.initial ?? (param.kind === 'enum' ? (param.options?.[0] ?? '') : '');
  }
  return values;
}
