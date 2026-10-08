'use client';

import type { ReactNode } from 'react';
import { useActiveHomeDesign } from '@/lib/homeDesign';
import type { HomeVariant } from '@/lib/featureFlags';

/**
 * Which tint the glass nav takes over each part of /traveller, per design
 * (TopNav reads data-nav-tone under its pill). Midnight uses the standard
 * bar, which ignores it.
 */
const NAV_TONES: Record<HomeVariant, { header: string; body: string }> = {
  prism: { header: 'dark', body: 'dark' },
  terracotta: { header: 'hero', body: 'light' },
  midnight: { header: 'dark', body: 'light' },
};

/**
 * The page's full-bleed frame: a header band and the body, both coloured by
 * app/traveller/traveller.css from the live design. Only the nav tones need
 * script; everything visible is decided by CSS before first paint.
 */
export function TravellerFrame({ header, children }: { header: ReactNode; children: ReactNode }) {
  const tones = NAV_TONES[useActiveHomeDesign()];
  return (
    <>
      <header
        data-nav-tone={tones.header}
        className="bg-[image:var(--tv-hero-bg)] text-[var(--tv-hero-ink)]"
      >
        {header}
      </header>
      <div data-nav-tone={tones.body}>{children}</div>
    </>
  );
}
