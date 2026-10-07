import type { Metadata } from "next";
import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import { homeVariant, type HomeVariant } from "@/lib/featureFlags";
import { routeMetadata } from "@/src/seo/seo.config";

export const metadata: Metadata = routeMetadata["/"];

// Which homepage renders is the NEXT_PUBLIC_HOME_VARIANT flag; the designs and
// their screenshots are in docs/home-designs/README.md. Each is loaded with
// next/dynamic so an unselected design's client code stays out of the page.
// (Its next/font preloads do not: Next collects those from every imported
// module, so a midnight build still preloads terracotta's three fonts.)
// Typed as a Record over every variant, so registering a design in
// lib/featureFlags.ts without adding it here fails the typecheck.
const homes: Record<HomeVariant, ComponentType> = {
  midnight: dynamic(() => import("@/components/home/midnight/MidnightHome").then((m) => m.MidnightHome)),
  terracotta: dynamic(() => import("@/components/home/terracotta/TerracottaHome").then((m) => m.TerracottaHome))
};

export default function HomePage() {
  const Home = homes[homeVariant];
  return <Home />;
}
