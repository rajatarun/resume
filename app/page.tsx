import type { Metadata } from 'next';
import type { ComponentType } from 'react';
import { HomeDesignSync } from '@/components/home/HomeDesignSync';
import { MidnightHome } from '@/components/home/midnight/MidnightHome';
import { TerracottaHome } from '@/components/home/terracotta/TerracottaHome';
import { HOME_VARIANTS, type HomeVariant } from '@/lib/featureFlags';
import { routeMetadata } from '@/src/seo/seo.config';

export const metadata: Metadata = routeMetadata['/'];

// Every design is rendered; the CSS in the root layout's <head> shows the live one,
// which admin chooses at runtime (lib/featureFlags.ts explains the flow, and
// docs/home-designs/README.md shows each design). Typed as a Record over every
// design name, so adding a design without its component fails typecheck.
const homes: Record<HomeVariant, ComponentType> = {
  midnight: MidnightHome,
  terracotta: TerracottaHome,
};

export default function HomePage() {
  return (
    <>
      <HomeDesignSync />
      {HOME_VARIANTS.map((name) => {
        const Home = homes[name];
        return (
          <div key={name} data-home-design={name}>
            <Home />
          </div>
        );
      })}
    </>
  );
}
