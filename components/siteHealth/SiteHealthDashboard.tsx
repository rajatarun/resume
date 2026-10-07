"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CATEGORIES,
  STRATEGIES,
  bandOf,
  buildPsiRequestUrl,
  pageSpeedUiUrl,
  parsePsiResponse,
  type AuditTarget,
  type Band,
  type HealthReport,
  type Strategy
} from "@/lib/siteHealth";

/*
 * Status colours from the dataviz reference palette (good / warning /
 * critical), mapped to Lighthouse's three bands. Colour never carries the
 * band alone: every band also has Lighthouse's own shape and a text label,
 * and numbers stay in ink.
 */
const BAND = {
  good: { color: "#0ca30c", label: "Good", shape: "●" },
  average: { color: "#fab219", label: "Needs work", shape: "■" },
  poor: { color: "#d03b3b", label: "Poor", shape: "▲" }
} as const satisfies Record<Band, { color: string; label: string; shape: string }>;

const STORAGE_KEY = "site-health-reports-v1";

type Entry =
  | { status: "running"; startedAt: number }
  | { status: "done"; report: HealthReport }
  | { status: "error"; message: string };

const keyOf = (path: string, strategy: Strategy) => `${path}|${strategy}`;

function loadSaved(): Record<string, Entry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Entry>) : {};
  } catch {
    return {};
  }
}

function BandMark({ band, withLabel = true, label }: { band: Band; withLabel?: boolean; label?: string }) {
  const b = { ...BAND[band], label: label ?? BAND[band].label };
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-slate-600 dark:text-slate-300">
      <span aria-hidden="true" style={{ color: b.color }}>
        {b.shape}
      </span>
      {withLabel ? b.label : <span className="sr-only">{b.label}</span>}
    </span>
  );
}

function ScoreRing({ label, score }: { label: string; score: number | null }) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const band = score === null ? null : bandOf(score);
  return (
    <figure className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
      <svg viewBox="0 0 100 100" className="h-24 w-24" role="img" aria-label={`${label}: ${score ?? "no score"} out of 100`}>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" className="stroke-slate-200 dark:stroke-slate-700" />
        {score !== null && band && (
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            stroke={BAND[band].color}
            strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
            transform="rotate(-90 50 50)"
          />
        )}
        <text x="50" y="57" textAnchor="middle" className="fill-slate-900 text-[22px] font-semibold dark:fill-slate-100">
          {score ?? "–"}
        </text>
      </svg>
      <figcaption className="space-y-1">
        <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">{label}</span>
        {band && <BandMark band={band} />}
      </figcaption>
    </figure>
  );
}

function ReportDetail({ report }: { report: HealthReport }) {
  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        <span className="font-medium text-slate-900 dark:text-slate-100">{report.url}</span> · {report.strategy} ·{" "}
        {new Date(report.fetchedAt).toLocaleString()} · Lighthouse {report.lighthouseVersion} ·{" "}
        <a
          href={pageSpeedUiUrl(report.url, report.strategy)}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring text-sky-700 underline underline-offset-2 dark:text-sky-400"
        >
          Full report on PageSpeed Insights ↗
        </a>
      </p>

      <section aria-labelledby="scores-heading">
        <h2 id="scores-heading" className="sr-only">
          Scores
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {CATEGORIES.map((c) => (
            <ScoreRing key={c.id} label={c.label} score={report.scores[c.id]} />
          ))}
        </div>
      </section>

      <section aria-labelledby="lab-heading" className="space-y-3">
        <h2 id="lab-heading" className="text-lg font-semibold">
          Core Web Vitals <span className="text-sm font-normal text-slate-500">(lab, simulated {report.strategy})</span>
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {report.lab.map((m) => (
            <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <dt className="text-xs text-slate-500 dark:text-slate-400" title={m.label}>
                {m.label}
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{m.display}</dd>
              <dd className="mt-1 text-sm">
                <BandMark band={m.band} />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="field-heading" className="space-y-3">
        <h2 id="field-heading" className="text-lg font-semibold">
          Real visitors <span className="text-sm font-normal text-slate-500">(Chrome field data, last 28 days)</span>
        </h2>
        {report.field ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {report.field.scope === "page"
                ? "Measured on this page."
                : "This page has too little traffic of its own, so this is the whole site (origin)."}{" "}
              {report.field.overall && (
                <>
                  Overall: <BandMark band={report.field.overall} />
                </>
              )}
            </p>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {report.field.metrics.map((m) => (
                <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <dt className="text-xs text-slate-500 dark:text-slate-400">{m.label} (p75)</dt>
                  <dd className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{m.display}</dd>
                  <dd className="mt-1 text-sm">
                    <BandMark band={m.band} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
            Google doesn&apos;t have enough Chrome traffic for this site yet to publish real-visitor data. The lab
            scores above are what Lighthouse measures in a simulated visit.
          </p>
        )}
      </section>

      <section aria-labelledby="fix-heading" className="space-y-3">
        <h2 id="fix-heading" className="text-lg font-semibold">
          What to fix
        </h2>
        <div className="space-y-2">
          {CATEGORIES.map((c) => {
            const items = report.failing[c.id];
            return (
              <details
                key={c.id}
                open={items.length > 0 && items.length <= 6}
                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <summary className="focus-ring cursor-pointer font-medium">
                  {c.label}: {items.length === 0 ? "nothing to fix" : `${items.length} to fix`}
                </summary>
                {items.length > 0 && (
                  <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((a) => (
                      <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2 text-sm">
                        <span className="text-slate-900 dark:text-slate-100">
                          {a.title}
                          {a.display && <span className="text-slate-500 dark:text-slate-400"> · {a.display}</span>}
                          {a.items > 0 && (
                            <span className="text-slate-500 dark:text-slate-400">
                              {" "}
                              · {a.items} {a.items === 1 ? "item" : "items"}
                            </span>
                          )}
                        </span>
                        {a.score === null ? <BandMark band="poor" label="Failed" /> : <BandMark band={bandOf(a.score)} />}
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/**
 * The unlisted site-health page: live Lighthouse audits of the deployed site
 * via Google PageSpeed Insights, one page at a time or every page in turn,
 * with the last results kept in this browser.
 */
export function SiteHealthDashboard({
  baseUrl,
  targets,
  apiKey
}: {
  baseUrl: string;
  targets: AuditTarget[];
  apiKey?: string;
}) {
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [path, setPath] = useState(targets[0]?.path ?? "/");
  const [strategy, setStrategy] = useState<Strategy>("mobile");
  const [scan, setScan] = useState<{ done: number; total: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [restored, setRestored] = useState(false);

  useEffect(() => {
    // Finished results only; a run that was in flight when the page closed is gone.
    const saved = loadSaved();
    setEntries(Object.fromEntries(Object.entries(saved).filter(([, e]) => e.status === "done")));
    setRestored(true);
  }, []);

  useEffect(() => {
    // Not until the restore above has rendered: on the first render `entries`
    // is still empty, and saving it would wipe what was stored. (A ref would
    // not do: both effects run in the same commit, so it is already set.)
    if (!restored) return;
    try {
      const done = Object.fromEntries(Object.entries(entries).filter(([, e]) => e.status === "done"));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
    } catch {
      // storage full or blocked: results just won't survive a reload
    }
  }, [entries, restored]);

  const audit = useCallback(
    async (targetPath: string, targetStrategy: Strategy, signal: AbortSignal) => {
      const key = keyOf(targetPath, targetStrategy);
      setEntries((prev) => ({ ...prev, [key]: { status: "running", startedAt: Date.now() } }));
      try {
        const response = await fetch(buildPsiRequestUrl(`${baseUrl}${targetPath}`, targetStrategy, apiKey), { signal });
        const body: unknown = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error(
            apiKey
              ? "Google's PageSpeed quota is used up for now. Try again in a minute."
              : "Google is rate-limiting anonymous audits. Wait a minute, or set NEXT_PUBLIC_PAGESPEED_API_KEY (free) for a much higher limit."
          );
        }
        const report = parsePsiResponse(body, targetStrategy);
        setEntries((prev) => ({ ...prev, [key]: { status: "done", report } }));
      } catch (error) {
        if (signal.aborted) {
          setEntries((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
          return;
        }
        const message = error instanceof Error ? error.message : "The audit failed.";
        setEntries((prev) => ({ ...prev, [key]: { status: "error", message } }));
      }
    },
    [apiKey, baseUrl]
  );

  async function runOne() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    await audit(path, strategy, controller.signal);
  }

  async function scanAll() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const jobs = targets.flatMap((t) => STRATEGIES.map((s) => [t.path, s] as const));
    setScan({ done: 0, total: jobs.length });
    // One at a time: PageSpeed Insights rate-limits parallel requests.
    for (let i = 0; i < jobs.length; i++) {
      if (controller.signal.aborted) break;
      const [p, s] = jobs[i];
      setPath(p);
      setStrategy(s);
      await audit(p, s, controller.signal);
      setScan({ done: i + 1, total: jobs.length });
    }
    setScan(null);
  }

  function stop() {
    abortRef.current?.abort();
    setScan(null);
  }

  const current = entries[keyOf(path, strategy)];
  const busy = scan !== null || current?.status === "running";
  const anyDone = Object.values(entries).some((e) => e.status === "done");

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Unlisted · not indexed</p>
        <h1 className="text-3xl font-semibold tracking-tight">Site health</h1>
        <p className="max-w-3xl text-slate-600 dark:text-slate-400">
          Live Lighthouse audits of <span className="font-medium text-slate-900 dark:text-slate-100">{baseUrl}</span> from
          Google PageSpeed Insights: performance, accessibility (ADA / WCAG), best practices and SEO, the same scores Google
          reports. Each audit takes 15–40 seconds and runs against the deployed site, not this browser.
        </p>
      </header>

      <section aria-label="Run an audit" className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Page</span>
            <select
              value={path}
              onChange={(e) => setPath(e.target.value)}
              disabled={scan !== null}
              className="focus-ring rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
            >
              {targets.map((t) => (
                <option key={t.path} value={t.path}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="flex flex-col gap-1 text-sm" disabled={scan !== null}>
            <legend className="mb-1 font-medium">Device</legend>
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5 dark:border-slate-700">
              {STRATEGIES.map((s) => (
                <label
                  key={s}
                  className={`focus-within:ring-2 focus-within:ring-sky-500 cursor-pointer rounded-md px-3 py-1.5 capitalize ${
                    strategy === s ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="strategy"
                    value={s}
                    checked={strategy === s}
                    onChange={() => setStrategy(s)}
                    className="sr-only"
                  />
                  {s}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runOne}
              disabled={busy}
              className="focus-ring rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
            >
              {current?.status === "done" ? "Run again" : "Run audit"}
            </button>
            {scan === null ? (
              <button
                type="button"
                onClick={scanAll}
                disabled={busy}
                className="focus-ring rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
              >
                Scan every page ({targets.length * STRATEGIES.length} audits)
              </button>
            ) : (
              <button
                type="button"
                onClick={stop}
                className="focus-ring rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 dark:border-red-800 dark:text-red-300"
              >
                Stop scan
              </button>
            )}
          </div>
        </div>
        {!apiKey && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No API key set: Google allows only a few anonymous audits a minute. A free key in{" "}
            <code>NEXT_PUBLIC_PAGESPEED_API_KEY</code> lifts that to 25,000 a day.
          </p>
        )}
        <p role="status" aria-live="polite" className="text-sm text-slate-600 dark:text-slate-400">
          {scan
            ? `Scanning: ${scan.done} of ${scan.total} done. Now auditing ${path} on ${strategy}…`
            : current?.status === "running"
              ? `Auditing ${path} on ${strategy}… this takes 15–40 seconds.`
              : ""}
        </p>
      </section>

      {current?.status === "error" && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {current.message}
        </p>
      )}
      {current?.status === "done" && <ReportDetail report={current.report} />}
      {!current && !anyDone && (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-600 dark:border-slate-700 dark:text-slate-400">
          Pick a page and run an audit, or scan every page.
        </p>
      )}

      {anyDone && (
        <section aria-labelledby="summary-heading" className="space-y-3">
          <h2 id="summary-heading" className="text-lg font-semibold">
            All pages
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th scope="col" rowSpan={2} className="px-3 py-2 align-bottom">
                    Page
                  </th>
                  {STRATEGIES.map((s) => (
                    <th key={s} scope="colgroup" colSpan={CATEGORIES.length} className="px-3 pt-2 text-center capitalize">
                      {s}
                    </th>
                  ))}
                </tr>
                <tr>
                  {STRATEGIES.flatMap((s) =>
                    CATEGORIES.map((c) => (
                      <th key={`${s}-${c.id}`} scope="col" className="px-3 pb-2 text-center font-medium normal-case" title={c.label}>
                        {c.id === "best-practices" ? "Best pr." : c.id === "accessibility" ? "A11y" : c.label}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {targets.map((t) => (
                  <tr key={t.path} className={t.path === path ? "bg-sky-50/60 dark:bg-sky-950/30" : undefined}>
                    <th scope="row" className="px-3 py-2 text-left font-normal">
                      <button
                        type="button"
                        onClick={() => setPath(t.path)}
                        disabled={scan !== null}
                        className="focus-ring text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
                      >
                        {t.label}
                      </button>
                    </th>
                    {STRATEGIES.flatMap((s) => {
                      const e = entries[keyOf(t.path, s)];
                      return CATEGORIES.map((c) => {
                        const score = e?.status === "done" ? e.report.scores[c.id] : null;
                        return (
                          <td key={`${s}-${c.id}`} className="px-3 py-2 text-center tabular-nums">
                            {e?.status === "running" ? (
                              <span className="text-slate-400">…</span>
                            ) : e?.status === "error" ? (
                              <span className="text-slate-400" title={e.message}>
                                err
                              </span>
                            ) : score === null ? (
                              <span className="text-slate-300 dark:text-slate-600">–</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-900 dark:text-slate-100">
                                {score} <BandMark band={bandOf(score)} withLabel={false} />
                              </span>
                            )}
                          </td>
                        );
                      });
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Results are kept in this browser only. Click a page to see its details.
          </p>
        </section>
      )}
    </div>
  );
}
