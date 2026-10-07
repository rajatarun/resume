/**
 * Build-time feature flags. The site is a static export, so a flag is read
 * when `next build` runs and baked into the HTML: to flip one, change the
 * environment variable (in Amplify: App settings → Environment variables)
 * and redeploy. NEXT_PUBLIC_ keeps the value readable in client components
 * too, so the server-rendered page and the client agree on it.
 */

/**
 * Homepage designs that can be swapped in, by name. What each looks like, with
 * screenshots: docs/home-designs/README.md. To add one, add its name here, its
 * component to `homes` in app/page.tsx, and an entry to that README.
 *
 *   midnight   — the original: dark navy gradient hero card, expertise cards
 *   terracotta — the editorial redesign: desk-scene video hero, glass nav
 */
export const HOME_VARIANTS = ["midnight", "terracotta"] as const;
export type HomeVariant = (typeof HOME_VARIANTS)[number];

/** What runs when the flag is unset or unrecognised, so a typo still ships a known design. */
export const DEFAULT_HOME_VARIANT: HomeVariant = "terracotta";

export function resolveHomeVariant(value: string | undefined): HomeVariant {
  const normalised = value?.trim().toLowerCase();
  return (HOME_VARIANTS as readonly string[]).includes(normalised ?? "")
    ? (normalised as HomeVariant)
    : DEFAULT_HOME_VARIANT;
}

// Referenced literally (not via process.env[name]) so Next inlines it at build time.
export const homeVariant: HomeVariant = resolveHomeVariant(process.env.NEXT_PUBLIC_HOME_VARIANT);
