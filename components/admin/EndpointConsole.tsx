'use client';

import { useMemo, useState } from 'react';
import {
  callEndpoint,
  initialValues,
  resolvePath,
  type CallResult,
  type Endpoint,
  type EndpointParam,
} from '@/lib/admin/endpoints';
import { propose, type Proposal } from '@/lib/admin/gate';
import { InlineGate } from '@/components/admin/InlineGate';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ARTICLE_STATUSES, type ArticleStatus } from '@/lib/admin/types';

const FIELD =
  'w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';

function Field({
  param,
  value,
  onChange,
}: {
  param: EndpointParam;
  value: string;
  onChange: (next: string) => void;
}) {
  const id = `param-${param.name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
        {param.name}
        {param.required && <span className="ml-1 text-red-600">*</span>}
      </label>

      {param.kind === 'enum' ? (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={FIELD}>
          {param.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : param.kind === 'text' ? (
        <textarea
          id={id}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${FIELD} py-2 leading-relaxed`}
        />
      ) : (
        <input
          id={id}
          type={param.kind === 'integer' ? 'number' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={FIELD}
        />
      )}

      {/* Where a parameter lives is not decoration: it is the difference
          between a path segment and a body field when a call misbehaves. */}
      <p className="mt-1 font-mono text-[10px] text-slate-500">
        {param.in} · {param.kind}
        {param.required ? ' · required' : ''}
      </p>
    </div>
  );
}

function isArticleStatus(value: unknown): value is ArticleStatus {
  return typeof value === 'string' && (ARTICLE_STATUSES as readonly string[]).includes(value);
}

function ArticleList({ body }: { body: unknown }) {
  const items =
    body && typeof body === 'object' && Array.isArray((body as { items?: unknown }).items)
      ? ((body as { items: unknown[] }).items as Array<Record<string, unknown>>)
      : [];

  if (items.length === 0) {
    return <p className="text-sm text-slate-500">No articles in that status.</p>;
  }

  return (
    <>
      <ul className="divide-y dark:divide-slate-700">
        {items.map((item, i) => {
          const status = item.status;
          return (
            <li key={String(item.id ?? i)} className="flex items-start justify-between gap-3 py-2.5">
              <span className="min-w-0 text-sm text-slate-900 dark:text-slate-100">
                {String(item.title ?? item.id ?? 'untitled')}
              </span>
              {isArticleStatus(status) && <StatusBadge status={status} />}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 font-mono text-[11px] text-slate-500">items: {items.length}</p>
    </>
  );
}

function AnswerView({ body }: { body: unknown }) {
  if (!body || typeof body !== 'object') return <JsonView body={body} />;
  const r = body as Record<string, unknown>;
  const sources = Array.isArray(r.sources) ? (r.sources as Array<Record<string, unknown>>) : [];
  const routing = (r.routingDecision ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-3">
      {typeof r.answer === 'string' && (
        <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-100">{r.answer}</p>
      )}

      {sources.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wide text-slate-500">Sources</p>
          <ul className="mt-1.5 space-y-1">
            {sources.slice(0, 6).map((source, i) => (
              <li key={i} className="flex items-center justify-between gap-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                <span className="min-w-0 truncate">{String(source.path ?? source.source ?? source.id ?? '—')}</span>
                {typeof source.weight === 'number' && <span className="shrink-0">{source.weight.toFixed(2)}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {typeof routing.strategy === 'string' && <Tag>strategy {routing.strategy}</Tag>}
        {typeof routing.selectionPropensity === 'number' && (
          <Tag>propensity {routing.selectionPropensity.toFixed(2)}</Tag>
        )}
        {typeof r.cacheHit === 'boolean' && <Tag>cacheHit {String(r.cacheHit)}</Tag>}
        {typeof r.confidence === 'number' && <Tag>confidence {r.confidence.toFixed(2)}</Tag>}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
      {children}
    </span>
  );
}

function JsonView({ body }: { body: unknown }) {
  return (
    <pre className="max-h-72 overflow-auto rounded-lg bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-slate-700 dark:bg-slate-900 dark:text-slate-300">
      {body === null || body === undefined ? '(empty body)' : JSON.stringify(body, null, 2)}
    </pre>
  );
}

export function EndpointConsole({ endpoint, onBack }: { endpoint: Endpoint; onBack: () => void }) {
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(endpoint));
  const [result, setResult] = useState<CallResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [staged, setStaged] = useState<Proposal | null>(null);

  const preview = useMemo(() => resolvePath(endpoint, values), [endpoint, values]);

  async function run() {
    setBusy(true);
    setStaged(null);
    try {
      setResult(await callEndpoint(endpoint, values));
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    // A write is proposed, scored and committed separately — the same
    // contract the rest of the admin holds to. A console that fired writes
    // directly would be a way around the gate rather than a view onto it.
    if (endpoint.write) {
      setResult(null);
      setStaged(propose('publish', `${endpoint.method} ${preview}`, preview));
      return;
    }
    void run();
  }

  return (
    <section className="space-y-4">
      <button type="button" onClick={onBack} className="min-h-[44px] text-sm text-blue-600 underline">
        ← All products
      </button>

      <div className="rounded-xl border dark:border-slate-700">
        <div className="border-b bg-slate-100 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
          <p className="break-all font-mono text-xs text-slate-900 dark:text-slate-100">
            {endpoint.method} {preview}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">{endpoint.product}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 p-4">
          {endpoint.params.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">This endpoint takes no parameters.</p>
          ) : (
            endpoint.params.map((param) => (
              <Field
                key={param.name}
                param={param}
                value={values[param.name] ?? ''}
                onChange={(next) => setValues((prev) => ({ ...prev, [param.name]: next }))}
              />
            ))
          )}

          <button
            type="submit"
            disabled={busy}
            className={`min-h-[44px] w-full rounded-lg px-4 text-sm font-medium text-white disabled:opacity-60 ${
              endpoint.write ? 'bg-amber-700 hover:bg-amber-800' : 'bg-slate-900 hover:bg-slate-700'
            }`}
          >
            {busy ? 'Running…' : endpoint.write ? 'Propose' : 'Send'}
          </button>
        </form>
      </div>

      {staged && (
        <div className="overflow-hidden rounded-xl border dark:border-slate-700">
          <div className="border-b bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            Proposal — nothing sent
          </div>
          <InlineGate
            proposal={staged}
            busy={busy}
            onCommit={() => void run()}
            onDiscard={() => setStaged(null)}
          />
        </div>
      )}

      {result && (
        <div className="overflow-hidden rounded-xl border dark:border-slate-700">
          <div className="flex items-center justify-between gap-3 border-b bg-slate-100 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Response</span>
            <span className="font-mono text-[11px] text-slate-500">
              {result.status || '—'} · {result.ms} ms
            </span>
          </div>
          <div className="p-4">
            {result.error && <p className="mb-2 text-sm text-red-600">{result.error}</p>}
            {endpoint.render === 'articles' && !result.error ? (
              <ArticleList body={result.body} />
            ) : endpoint.render === 'answer' && !result.error ? (
              <AnswerView body={result.body} />
            ) : (
              <JsonView body={result.body} />
            )}
            <p className="mt-3 break-all font-mono text-[10px] text-slate-500">{result.url}</p>
          </div>
        </div>
      )}
    </section>
  );
}
