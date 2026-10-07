'use client';

/**
 * Which homepage design is showing, at runtime.
 *
 * Every design is in the homepage's HTML; CSS shows the one named by the
 * `data-home` attribute on <html> (lib/homeDesignBoot.ts, inlined in the root
 * layout's <head>). That attribute is the single source of truth: an inline
 * script sets it before first paint from
 * the last design this browser saw, and HomeDesignSync then corrects it from
 * the saved setting. Components with side effects that belong to one design
 * (the hero video, the glass nav) read it through useActiveHomeDesign, so a
 * hidden design never fetches a video or restyles the nav.
 */
import { useSyncExternalStore } from 'react';
import {
  HOME_DESIGN_STORAGE_KEY,
  fallbackHomeVariant,
  resolveHomeVariant,
  type HomeVariant,
} from '@/lib/featureFlags';

export const HOME_ATTR = 'data-home';
export const HOME_PREVIEW_ATTR = 'data-home-preview';
/** Set once the saved setting has been applied (or could not be fetched). */
export const HOME_SETTLED_ATTR = 'data-home-settled';

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [HOME_ATTR, HOME_SETTLED_ATTR],
  });
  return () => observer.disconnect();
}

function readActive(): HomeVariant {
  return resolveHomeVariant(document.documentElement.getAttribute(HOME_ATTR), fallbackHomeVariant);
}

/** The design currently showing. Server render (and hydration) assume the build's fallback. */
export function useActiveHomeDesign(): HomeVariant {
  return useSyncExternalStore(subscribe, readActive, () => fallbackHomeVariant);
}

/**
 * True once the design on screen is the one that will stay: the saved setting
 * arrived, or could not be fetched, or this is a preview. Heavy, design-only
 * work (the hero video) waits for it, so a first visit does not start loading
 * a design that is about to be swapped out.
 */
export function useHomeDesignSettled(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.hasAttribute(HOME_SETTLED_ATTR),
    () => false,
  );
}

/** Show a design now, and remember it for this browser's next visit. */
export function applyHomeDesign(variant: HomeVariant): void {
  document.documentElement.setAttribute(HOME_ATTR, variant);
  try {
    localStorage.setItem(HOME_DESIGN_STORAGE_KEY, variant);
  } catch {
    // Storage blocked (private mode, disabled cookies): it still shows; it just won't be remembered.
  }
}

export interface SiteSettings {
  homeVariant: string | null;
  updatedAt: string | null;
}

/** GET /site/settings from the content API. Public; no credentials. */
export async function fetchSiteSettings(signal?: AbortSignal): Promise<SiteSettings> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new Error('NEXT_PUBLIC_API_BASE_URL is not configured.');
  const response = await fetch(`${base.replace(/\/$/, '')}/site/settings`, {
    signal,
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`GET /site/settings failed with ${response.status}.`);
  return (await response.json()) as SiteSettings;
}
