import type { Metadata } from 'next';
import { HomeDesignSync } from '@/components/home/HomeDesignSync';
import { editorialFontVariables } from '@/components/home/terracotta/fonts';
import { TravelMap } from '@/components/traveller/TravelMap';
import { TravellerFrame } from '@/components/traveller/TravellerFrame';
import { loadTravelData } from '@/lib/travel/load';
import { DEFAULT_COUNTRY, buildMapViews, countryName } from '@/lib/travelMap';
import { routeMetadata } from '@/src/seo/seo.config';
import './traveller.css';

export const metadata: Metadata = routeMetadata['/traveller'];

export default function TravellerPage() {
  // All at build time: read places.json and the journal the content API
  // serves without dates (scripts/sync-travel.mjs), merge, project. The
  // browser gets SVG paths, pins and trips, not a map library.
  const { places, trips, dining, stays, skipped } = loadTravelData();
  // eslint-disable-next-line no-console -- a build log line, so a dropped place is visible in Amplify
  for (const reason of skipped) console.warn(`[traveller] skipped ${reason}`);
  const views = buildMapViews(places);
  const countryNames = Object.fromEntries(
    Array.from(new Set(places.map((p) => p.country)), (code) => [code, countryName(code)]),
  );

  return (
    // Full-bleed like the homepage designs, stepping out of the root layout's
    // padded <main>, and themed like whichever of them is live
    // (traveller.css). HomeDesignSync applies the design saved in admin, so a
    // visitor who lands here first still gets it; /traveller?home=<name>
    // previews one.
    <div
      className={`traveller ${editorialFontVariables} relative left-1/2 -mb-16 -mt-24 w-screen -translate-x-1/2`}
    >
      <HomeDesignSync />
      <TravellerFrame
        header={
          <div className="mx-auto max-w-6xl px-4 pb-14 pt-32 sm:px-6 lg:px-8">
            <p className="tv-label text-[11px] uppercase tracking-[0.3em] text-[var(--tv-kicker)]">
              {'// Tarun Raja · Traveller'}
            </p>
            <h1 className="tv-title mt-4 text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.95] tracking-tight">
              Where I have been
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--tv-hero-muted)]">
              Cafés, cities and long walks somewhere new. Every pin is a place I have photographed,
              read off the map of my photo library; pick a country to zoom in, or see the whole
              world.
            </p>
          </div>
        }
      >
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
          <TravelMap
            views={views}
            places={places}
            countryNames={countryNames}
            trips={trips}
            dining={dining}
            stays={stays}
            defaultView={DEFAULT_COUNTRY}
          />
        </div>
      </TravellerFrame>
    </div>
  );
}
