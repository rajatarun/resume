/**
 * The Platform tab shipped showing "0 with a live API base URL" because it had
 * exactly one source of truth for those URLs and that source 404s until a
 * workflow runs on main. These pin the two-source resolution that replaced it.
 */

// Each NEXT_PUBLIC_* read has to be a literal `process.env.X` for Next to
// inline it at build, which also means the module reads them at call time --
// so setting them before importing is enough, and resolveProducts stays a
// pure function of (products, env).
process.env.NEXT_PUBLIC_ADMIN_API_BASE = 'https://admin.execute-api.us-east-1.amazonaws.com/prod';
process.env.NEXT_PUBLIC_AGENT_MANAGEMENT_API_BASE = 'https://team.execute-api.us-east-1.amazonaws.com/prod';
process.env.NEXT_PUBLIC_ABOUT_CHAT_API = 'https://ctx.execute-api.us-east-1.amazonaws.com/prod/query-expertise';
process.env.NEXT_PUBLIC_SIWE_API_BASE = 'https://<api-id>.execute-api.<region>.amazonaws.com/<stage>';
process.env.NEXT_PUBLIC_DEVICEWEAVE_API_URL = '';

import { resolveProducts, localApiBases, type PlatformProduct } from '@/lib/admin/platform';

function product(name: string, apiBaseUrl: string | null = null): PlatformProduct {
  return {
    name,
    repo: `https://github.com/rajatarun/${name}`,
    category: 'Orchestration',
    description: '',
    apiBaseUrl,
    openApiSpecUrl: null,
    status: 'active',
  };
}

describe('localApiBases', () => {
  it('reads the URLs this site is already built against', () => {
    const bases = localApiBases();
    expect(bases['ai-content-orchestrator']).toBe('https://admin.execute-api.us-east-1.amazonaws.com/prod');
    expect(bases.TeamWeave).toBe('https://team.execute-api.us-east-1.amazonaws.com/prod');
  });

  it('derives ContextWeave\'s base by stripping the endpoint path, not the whole URL', () => {
    // NEXT_PUBLIC_ABOUT_CHAT_API points at .../query-expertise. Treating it as
    // a base would render a URL that 404s for every other ContextWeave route.
    expect(localApiBases().ContextWeave).toBe('https://ctx.execute-api.us-east-1.amazonaws.com/prod');
  });

  it('treats an .env.example placeholder as not configured, not as a live URL', () => {
    // https://<api-id>.execute-api.<region>... is what a build picks up when
    // the var was never set. Showing it as "live API" would be a lie that
    // looks exactly like the truth.
    expect(localApiBases().AuthChain).toBeUndefined();
  });

  it('treats an empty env var as not configured', () => {
    expect(localApiBases().DeviceWeave).toBeUndefined();
  });
});

describe('resolveProducts', () => {
  it('prefers a stack output over this site\'s build config', () => {
    // The stack output is current; the build-time constant is only as fresh
    // as the last Amplify build. When both exist, the stack wins.
    const [resolved] = resolveProducts([
      product('ai-content-orchestrator', 'https://from-stack.example.com'),
    ]);
    expect(resolved.apiBaseUrl).toBe('https://from-stack.example.com');
    expect(resolved.apiSource).toBe('stack-output');
  });

  it('falls back to build config when the manifest carries no URL', () => {
    const [resolved] = resolveProducts([product('ai-content-orchestrator', null)]);
    expect(resolved.apiBaseUrl).toBe('https://admin.execute-api.us-east-1.amazonaws.com/prod');
    expect(resolved.apiSource).toBe('site-config');
  });

  it('reports no source rather than inventing one', () => {
    const [resolved] = resolveProducts([product('CipherWeave', null)]);
    expect(resolved.apiBaseUrl).toBeNull();
    expect(resolved.apiSource).toBeNull();
  });

  it('always labels a URL with where it came from', () => {
    // A URL with a null source would render "live API · undefined".
    const resolved = resolveProducts([
      product('ai-content-orchestrator', 'https://from-stack.example.com'),
      product('TeamWeave', null),
      product('CipherWeave', null),
    ]);
    for (const item of resolved) {
      expect(Boolean(item.apiBaseUrl)).toBe(item.apiSource !== null);
    }
  });

  it('resolves at least one live URL with an entirely empty manifest', () => {
    // This is the regression: the page went out showing 0 live URLs while
    // the site was actively calling several of them from its other tabs.
    const products = ['ai-content-orchestrator', 'TeamWeave', 'ContextWeave', 'CipherWeave'].map((n) =>
      product(n, null),
    );
    expect(resolveProducts(products).filter((p) => p.apiBaseUrl).length).toBeGreaterThan(0);
  });

  it('preserves every product, including ones with no API', () => {
    const products = [product('a'), product('b'), product('c')];
    expect(resolveProducts(products)).toHaveLength(3);
  });
});
