/**
 * The console builds real requests, so the parts that turn a form into a URL
 * are the parts worth pinning. Each of these has a silent failure mode: a URL
 * that looks right and 404s, a write that fires without passing the gate.
 */

process.env.NEXT_PUBLIC_ADMIN_API_BASE = 'https://admin.example.com/prod';
process.env.NEXT_PUBLIC_AGENT_MANAGEMENT_API_BASE = 'https://team.example.com/prod';
process.env.NEXT_PUBLIC_ABOUT_CHAT_API = 'https://ctx.example.com/prod/query-expertise';

import { ENDPOINTS, baseUrlFor, initialValues, resolvePath, type Endpoint } from '@/lib/admin/endpoints';

function byId(id: string): Endpoint {
  const endpoint = ENDPOINTS.find((e) => e.id === id);
  if (!endpoint) throw new Error(`no endpoint ${id}`);
  return endpoint;
}

describe('baseUrlFor', () => {
  it("derives ContextWeave's base by stripping the endpoint path", () => {
    // NEXT_PUBLIC_ABOUT_CHAT_API points at .../query-expertise. Treating it as
    // a base would send every ContextWeave call to /query-expertise/<path>.
    expect(baseUrlFor('ContextWeave')).toBe('https://ctx.example.com/prod');
  });

  it('uses the configured base as-is for the other two', () => {
    expect(baseUrlFor('ai-content-orchestrator')).toBe('https://admin.example.com/prod');
    expect(baseUrlFor('TeamWeave')).toBe('https://team.example.com/prod');
  });
});

describe('resolvePath', () => {
  it('substitutes path parameters rather than leaving the template', () => {
    const path = resolvePath(byId('article-action'), { id: 'a4f1', action: 'approve', note: '' });
    expect(path).toBe('/admin/articles/a4f1/actions/approve');
    expect(path).not.toContain('{');
  });

  it('url-encodes a path parameter', () => {
    const path = resolvePath(byId('article-action'), { id: 'a/b c', action: 'approve' });
    expect(path).toBe('/admin/articles/a%2Fb%20c/actions/approve');
  });

  it('appends query parameters', () => {
    const path = resolvePath(byId('articles-list'), { status: 'PUBLISHED', limit: '5' });
    expect(path).toBe('/admin/articles?status=PUBLISHED&limit=5');
  });

  it('omits an empty query parameter instead of sending a blank one', () => {
    // `?limit=` is not the same request as no limit, and the API is entitled
    // to reject it.
    expect(resolvePath(byId('articles-list'), { status: 'DRAFT', limit: '' })).toBe('/admin/articles?status=DRAFT');
  });

  it('leaves a path with no parameters alone', () => {
    expect(resolvePath(byId('observability'), {})).toBe('/observability');
  });

  it('never puts a body parameter in the URL', () => {
    const path = resolvePath(byId('query-expertise'), { question: 'secret question', topK: '6' });
    expect(path).toBe('/query-expertise');
  });
});

describe('the catalogue', () => {
  it('marks the lifecycle action as a write, so it stages at the gate', () => {
    // This is the whole point of the console not being a back door: the one
    // endpoint that changes an article's state must not fire on submit.
    expect(byId('article-action').write).toBe(true);
  });

  it('treats query-expertise as a read despite the POST verb', () => {
    // It answers a question and changes nothing an operator has to approve.
    expect(byId('query-expertise').method).toBe('POST');
    expect(byId('query-expertise').write).toBe(false);
  });

  it('has no other writes hiding in the catalogue', () => {
    expect(ENDPOINTS.filter((e) => e.write).map((e) => e.id)).toEqual(['article-action']);
  });

  it('declares every path template parameter as a path param', () => {
    for (const endpoint of ENDPOINTS) {
      const declared = endpoint.params.filter((p) => p.in === 'path').map((p) => p.name);
      const inTemplate = [...endpoint.path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      expect(declared.sort()).toEqual(inTemplate.sort());
    }
  });

  it('seeds every enum with one of its own options', () => {
    for (const endpoint of ENDPOINTS) {
      const values = initialValues(endpoint);
      for (const param of endpoint.params) {
        if (param.kind === 'enum') {
          expect(param.options).toContain(values[param.name]);
        }
      }
    }
  });
});
