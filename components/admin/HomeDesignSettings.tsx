'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/admin/ToastProvider';
import { ApiError, fetchJson } from '@/lib/admin/api';
import {
  HOME_DESIGNS,
  fallbackHomeVariant,
  isHomeVariant,
  type HomeVariant,
} from '@/lib/featureFlags';

interface AdminSiteSettings {
  homeVariant: string | null;
  updatedAt: string | null;
  updatedBy?: string | null;
}

type Load =
  | { state: 'loading' }
  | { state: 'ready'; live: HomeVariant; saved: AdminSiteSettings }
  | { state: 'error'; message: string };

/**
 * Pick which homepage design is live. Saving calls PATCH /admin/settings on
 * the content API; the homepage reads the setting on every load, so the
 * change is live on the next page view, no redeploy. "Preview" opens the
 * homepage with ?home=<name>, which shows a design in that tab only.
 */
export function HomeDesignSettings() {
  const toast = useToast();
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [choice, setChoice] = useState<HomeVariant>(fallbackHomeVariant);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchJson<AdminSiteSettings>('/admin/settings')
      .then((saved) => {
        const live = isHomeVariant(saved.homeVariant) ? saved.homeVariant : fallbackHomeVariant;
        setLoad({ state: 'ready', live, saved });
        setChoice(live);
      })
      .catch((error: unknown) =>
        setLoad({
          state: 'error',
          message: error instanceof Error ? error.message : 'Could not load settings.',
        }),
      );
  }, []);

  const live = load.state === 'ready' ? load.live : null;
  const unchanged = choice === live;

  async function save() {
    setSaving(true);
    try {
      const saved = await fetchJson<AdminSiteSettings>('/admin/settings', {
        method: 'PATCH',
        body: { homeVariant: choice },
      });
      const nowLive = isHomeVariant(saved.homeVariant) ? saved.homeVariant : fallbackHomeVariant;
      setLoad({ state: 'ready', live: nowLive, saved });
      toast.success(`Homepage design is now ${labelOf(nowLive)}. Live on the next page load.`);
    } catch (error) {
      toast.error(
        error instanceof ApiError || error instanceof Error ? error.message : 'Save failed.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="home-design-heading" className="space-y-4 rounded-lg border p-4">
      <div>
        <h2 id="home-design-heading" className="text-lg font-semibold">
          Homepage design
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Choose which design visitors see at <code>/</code>. Saving takes effect on the next page
          load; no redeploy.
        </p>
      </div>

      {load.state === 'loading' && (
        <p className="text-sm text-slate-500">Loading current setting…</p>
      )}
      {load.state === 'error' && (
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
        >
          Couldn&apos;t load the current setting: {load.message}
        </p>
      )}

      <fieldset disabled={load.state !== 'ready' || saving} className="grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">Homepage design</legend>
        {HOME_DESIGNS.map((design) => {
          const selected = choice === design.name;
          return (
            <label
              key={design.name}
              className={`group relative block cursor-pointer overflow-hidden rounded-lg border-2 transition focus-within:ring-2 focus-within:ring-sky-500 ${
                selected
                  ? 'border-slate-900 dark:border-slate-100'
                  : 'border-slate-200 hover:border-slate-400 dark:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="home-design"
                value={design.name}
                checked={selected}
                onChange={() => setChoice(design.name)}
                className="sr-only"
              />
              <Image
                src={design.thumbnail}
                alt=""
                width={640}
                height={400}
                className="aspect-[16/10] w-full border-b object-cover object-top dark:border-slate-700"
              />
              <div className="space-y-1 p-3">
                <p className="flex items-center gap-2 font-medium">
                  {design.label}
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
                    {design.name}
                  </code>
                  {live === design.name && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      Live
                    </span>
                  )}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{design.summary}</p>
                <a
                  href={`/?home=${design.name}`}
                  target="_blank"
                  rel="noopener"
                  className="inline-block text-sm text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
                  onClick={(event) => event.stopPropagation()}
                >
                  Preview ↗
                </a>
              </div>
              {selected && (
                <span
                  aria-hidden="true"
                  className="absolute right-2 top-2 rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white dark:bg-slate-100 dark:text-slate-900"
                >
                  Selected
                </span>
              )}
            </label>
          );
        })}
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={load.state !== 'ready' || saving || unchanged}
          className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
        >
          {saving ? 'Saving…' : unchanged ? 'Saved' : `Make ${labelOf(choice)} live`}
        </button>
        {load.state === 'ready' && load.saved.updatedAt && (
          <p className="text-xs text-slate-500">
            Last changed {new Date(load.saved.updatedAt).toLocaleString()}
            {load.saved.updatedBy ? ` by ${load.saved.updatedBy}` : ''}
          </p>
        )}
        {load.state === 'ready' && !load.saved.homeVariant && (
          <p className="text-xs text-slate-500">
            Never saved: showing the build default ({labelOf(fallbackHomeVariant)}).
          </p>
        )}
      </div>
    </section>
  );
}

function labelOf(name: HomeVariant): string {
  return HOME_DESIGNS.find((design) => design.name === name)?.label ?? name;
}
