'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import {
  fetchPlatformManifest,
  resolveProducts,
  CATEGORY_ORDER,
  type PlatformProduct,
  type ResolvedProduct,
} from '@/lib/admin/platform';
import { SpecExplorer } from './SpecExplorer';

const STATUS_STYLES: Record<PlatformProduct['status'], string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  archived: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  reserved: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
};

const SOURCE_LABEL: Record<'stack-output' | 'site-config', string> = {
  'stack-output': 'from stack output',
  'site-config': "from this site's config",
};

function ProductCard({ product }: { product: ResolvedProduct }) {
  const [expanded, setExpanded] = useState(false);
  const hasSpec = Boolean(product.openApiSpecUrl);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <a
            href={product.repo}
            target="_blank"
            rel="noreferrer noopener"
            className="focus-ring text-base font-semibold hover:underline"
          >
            {product.name}
          </a>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{product.description}</p>
        </div>
        <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[product.status]}`}>
          {product.status}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge text={product.category} />
        {product.apiBaseUrl && product.apiSource ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            live API · {SOURCE_LABEL[product.apiSource]}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
            no public API tracked here
          </span>
        )}
      </div>

      {product.apiBaseUrl && (
        <code className="truncate rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
          {product.apiBaseUrl}
        </code>
      )}

      {hasSpec && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="focus-ring self-start rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-expanded={expanded}
        >
          {expanded ? 'Hide API explorer' : 'Explore API'}
        </button>
      )}

      {hasSpec && expanded && product.openApiSpecUrl && (
        <SpecExplorer specUrl={product.openApiSpecUrl} />
      )}
    </Card>
  );
}

export default function PlatformClient() {
  const manifestQuery = useQuery({
    queryKey: ['platform-manifest'],
    queryFn: fetchPlatformManifest,
  });

  // Whatever the manifest fetch returned (live or fallback), every product is
  // then topped up from this site's own build config, so a missing manifest
  // costs the four stack-only entries, not the whole directory.
  const resolved = useMemo(
    () => resolveProducts(manifestQuery.data?.manifest.products ?? []),
    [manifestQuery.data],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, ResolvedProduct[]>();
    for (const product of resolved) {
      const list = map.get(product.category) ?? [];
      list.push(product);
      map.set(product.category, list);
    }
    return map;
  }, [resolved]);

  const liveCount = useMemo(() => resolved.filter((p) => p.apiBaseUrl).length, [resolved]);

  if (manifestQuery.isLoading) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading the platform directory…</p>;
  }

  const { manifest, isLive } = manifestQuery.data ?? { manifest: null, isLive: false };
  if (!manifest) {
    return <p className="text-sm text-red-600 dark:text-red-400">Could not load the platform directory.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {manifest.products.length} products across the platform · {liveCount} with a live API base URL
        </p>
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            stack manifest — generated {manifest.generatedAt || 'just now'}
          </span>
        ) : (
          // Not an error state: the URLs above still come from this site's own
          // build config. What's missing is only the stack-resolved extras,
          // which don't exist until that workflow has run on main.
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
            stack manifest not published yet — URLs below are from this site&rsquo;s build config
          </span>
        )}
      </div>

      {CATEGORY_ORDER.filter((category) => grouped.has(category)).map((category) => (
        <section key={category} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {category}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {grouped.get(category)!.map((product) => (
              <ProductCard key={product.name} product={product} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
