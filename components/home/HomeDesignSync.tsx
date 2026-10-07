'use client';

import { useEffect } from 'react';
import {
  HOME_DESIGN_STORAGE_KEY,
  HOME_PREVIEW_PARAM,
  fallbackHomeVariant,
  isHomeVariant,
  resolveHomeVariant,
} from '@/lib/featureFlags';
import {
  HOME_ATTR,
  HOME_PREVIEW_ATTR,
  HOME_SETTLED_ATTR,
  applyHomeDesign,
  fetchSiteSettings,
} from '@/lib/homeDesign';

/**
 * Brings the homepage in line with the design saved in admin. Renders nothing.
 *
 * A preview (?home=<name>) is left alone. When it is done (fetched, failed or
 * a preview) it marks the page settled, which is what the hero video waits for. Otherwise the saved setting wins; an
 * unset or unknown one means the build fallback. If the API cannot be reached
 * the page keeps whatever it is showing — the last design this browser saw,
 * or the fallback — rather than switching to something nobody chose.
 */
export function HomeDesignSync() {
  useEffect(() => {
    const root = document.documentElement;
    const preview = new URLSearchParams(window.location.search)
      .get(HOME_PREVIEW_PARAM)
      ?.toLowerCase();
    if (isHomeVariant(preview)) {
      // A client-side navigation to /?home=x skips the boot script; apply the preview here.
      root.setAttribute(HOME_ATTR, preview);
      root.setAttribute(HOME_PREVIEW_ATTR, '');
      root.setAttribute(HOME_SETTLED_ATTR, '');
      return;
    }
    root.removeAttribute(HOME_PREVIEW_ATTR);
    if (!root.hasAttribute(HOME_ATTR)) {
      let remembered: string | null = null;
      try {
        remembered = localStorage.getItem(HOME_DESIGN_STORAGE_KEY);
      } catch {
        // ignore: storage blocked
      }
      root.setAttribute(HOME_ATTR, resolveHomeVariant(remembered, fallbackHomeVariant));
    }

    const controller = new AbortController();
    fetchSiteSettings(controller.signal)
      .then((settings) =>
        applyHomeDesign(resolveHomeVariant(settings.homeVariant, fallbackHomeVariant)),
      )
      .catch(() => {
        // Unreachable or not configured: keep showing what is already on screen.
      })
      .finally(() => {
        if (!controller.signal.aborted) root.setAttribute(HOME_SETTLED_ATTR, '');
      });
    return () => controller.abort();
  }, []);

  return null;
}
