/**
 * Homepage designs, and which one is live.
 *
 * Which design shows is chosen at runtime: the admin UI (Admin → Content →
 * Settings) saves a name through the content API's PATCH /admin/settings, and
 * the homepage reads it from GET /site/settings on every load, so a change is
 * live on the next page view with no rebuild. NEXT_PUBLIC_HOME_VARIANT is only
 * the fallback, used before anything is saved or when the API is unreachable.
 *
 * What each design looks like, with screenshots: docs/home-designs/README.md.
 * To add one: add it to HOME_DESIGNS, add its component to `homes` in
 * app/page.tsx (typed over every name, so forgetting fails typecheck), add a
 * thumbnail at public/home-designs/<name>.jpg, and a README entry.
 */

export const HOME_DESIGNS = [
  {
    name: 'terracotta',
    label: 'Terracotta',
    summary:
      'Editorial: terracotta hero with the animated desk scene, glass nav, numbered sections.',
    thumbnail: '/home-designs/terracotta.jpg',
    nav: 'glass',
  },
  {
    name: 'midnight',
    label: 'Midnight',
    summary:
      'The original: dark navy gradient hero card with portrait, expertise and outcome cards.',
    thumbnail: '/home-designs/midnight.jpg',
    nav: 'standard',
  },
  {
    name: 'prism',
    label: 'Prism',
    summary:
      '"Know Tarun as…": the avatar walks from desk to camera to books to café, lighting up Software Architect, Photographer, AI Researcher and Traveller.',
    thumbnail: '/home-designs/prism.jpg',
    nav: 'glass',
  },
] as const;

export type HomeVariant = (typeof HOME_DESIGNS)[number]['name'];
/** Which TopNav a design uses: the site's standard bar, or the floating glass pill. */
export type HomeNavStyle = (typeof HOME_DESIGNS)[number]['nav'];
export const HOME_NAV_STYLES: readonly HomeNavStyle[] = ['standard', 'glass'];

export function navStyleOf(name: HomeVariant): HomeNavStyle {
  return HOME_DESIGNS.find((design) => design.name === name)?.nav ?? 'standard';
}
export const HOME_VARIANTS: readonly HomeVariant[] = HOME_DESIGNS.map((design) => design.name);

/** The default when nothing usable is configured, so a typo still ships a known design. */
export const DEFAULT_HOME_VARIANT: HomeVariant = 'terracotta';

export function isHomeVariant(value: unknown): value is HomeVariant {
  return typeof value === 'string' && (HOME_VARIANTS as readonly string[]).includes(value);
}

export function resolveHomeVariant(
  value: string | null | undefined,
  fallback: HomeVariant = DEFAULT_HOME_VARIANT,
): HomeVariant {
  const normalised = value?.trim().toLowerCase();
  return isHomeVariant(normalised) ? normalised : fallback;
}

// Referenced literally (not via process.env[name]) so Next inlines it at build time.
/** The design to show when the saved setting is unset or unreachable. */
export const fallbackHomeVariant: HomeVariant = resolveHomeVariant(
  process.env.NEXT_PUBLIC_HOME_VARIANT,
);

/** Where the homepage remembers the last design it showed, so a return visit paints it straight away. */
export const HOME_DESIGN_STORAGE_KEY = 'home-design';

/** `/?home=<name>` previews a design in this tab without saving it. */
export const HOME_PREVIEW_PARAM = 'home';
