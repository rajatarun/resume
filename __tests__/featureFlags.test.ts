/**
 * Which homepage design shows is decided in three places, in order: a preview
 * (?home=<name>), the design saved in admin (fetched at runtime), and the
 * build's NEXT_PUBLIC_HOME_VARIANT fallback. Every one of them can carry junk
 * — a typo from the Amplify console, a name the API stored before a design
 * was retired, a hand-edited URL — and every one must land on a design that
 * exists. The boot script is the part that decides what paints first, so it
 * is run here against a stand-in document rather than read.
 */
import {
  DEFAULT_HOME_VARIANT,
  navStyleOf,
  HOME_DESIGNS,
  HOME_VARIANTS,
  isHomeVariant,
  resolveHomeVariant,
} from '../lib/featureFlags';
import { homeDesignBootScript, homeDesignCss } from '../lib/homeDesignBoot';

describe('resolveHomeVariant', () => {
  it('defaults to terracotta', () => {
    expect(DEFAULT_HOME_VARIANT).toBe('terracotta');
    expect(resolveHomeVariant(undefined)).toBe('terracotta');
    expect(resolveHomeVariant(null)).toBe('terracotta');
    expect(resolveHomeVariant('')).toBe('terracotta');
  });

  it('selects each registered design by name', () => {
    expect(HOME_VARIANTS).toEqual(['terracotta', 'midnight']);
    for (const variant of HOME_VARIANTS) expect(resolveHomeVariant(variant)).toBe(variant);
  });

  it('tolerates case and whitespace', () => {
    expect(resolveHomeVariant(' Midnight \n')).toBe('midnight');
  });

  it('falls back for anything unrecognised, to the fallback it is given', () => {
    expect(resolveHomeVariant('midnite')).toBe('terracotta');
    expect(resolveHomeVariant('retired-design', 'midnight')).toBe('midnight');
    expect(isHomeVariant('classic')).toBe(false);
  });

  it('gives every design what the admin picker shows', () => {
    for (const design of HOME_DESIGNS) {
      expect(design.label).toBeTruthy();
      expect(design.summary).toBeTruthy();
      expect(design.thumbnail).toBe(`/home-designs/${design.name}.jpg`);
      expect(navStyleOf(design.name)).toBe(design.nav);
    }
  });
});

describe('the boot script', () => {
  function boot({ search = '', stored = null as string | null, storageThrows = false, fallback = 'terracotta' as const } = {}) {
    const attrs = new Map<string, string>();
    const document = { documentElement: { setAttribute: (k: string, v: string) => attrs.set(k, v) } };
    const localStorage = {
      getItem: () => {
        if (storageThrows) throw new Error('SecurityError');
        return stored;
      },
    };
    const run = new Function('document', 'localStorage', 'location', 'URLSearchParams', homeDesignBootScript(fallback));
    run(document, localStorage, { search }, URLSearchParams);
    return attrs;
  }

  it('shows the build fallback on a first visit', () => {
    expect(boot().get('data-home')).toBe('terracotta');
    expect(boot({ fallback: 'midnight' as never }).get('data-home')).toBe('midnight');
  });

  it('shows the design this browser last saw', () => {
    expect(boot({ stored: 'midnight' }).get('data-home')).toBe('midnight');
  });

  it('ignores a remembered name that is no longer a design', () => {
    expect(boot({ stored: 'retired' }).get('data-home')).toBe('terracotta');
  });

  it('still shows something when storage is blocked', () => {
    expect(boot({ storageThrows: true }).get('data-home')).toBe('terracotta');
  });

  it('lets ?home= preview a design and marks the page as a preview', () => {
    const attrs = boot({ search: '?home=Midnight', stored: 'terracotta' });
    expect(attrs.get('data-home')).toBe('midnight');
    expect(attrs.has('data-home-preview')).toBe(true);
  });

  it('ignores ?home= for a name that is not a design', () => {
    const attrs = boot({ search: '?home=<script>', stored: 'midnight' });
    expect(attrs.get('data-home')).toBe('midnight');
    expect(attrs.has('data-home-preview')).toBe(false);
  });
});

describe('the design CSS', () => {
  const css = homeDesignCss('terracotta');

  it('hides every design, and both homepage navs, by default', () => {
    expect(css.startsWith('[data-home-design],[data-home-nav]{display:none}')).toBe(true);
  });

  it('shows the nav each design declares, and only that one', () => {
    expect(css).toContain('html[data-home="terracotta"] [data-home-nav="glass"]');
    expect(css).toContain('html[data-home="midnight"] [data-home-nav="standard"]');
    expect(css).not.toContain('html[data-home="midnight"] [data-home-nav="glass"]');
    expect(css).toContain('html:not([data-home]) [data-home-nav="glass"]');
  });

  it('shows each design when it is the active one', () => {
    for (const name of HOME_VARIANTS) {
      expect(css).toContain(`html[data-home="${name}"] [data-home-design="${name}"]`);
    }
  });

  it('shows the fallback when nothing has set the attribute', () => {
    expect(css).toContain('html:not([data-home]) [data-home-design="terracotta"]');
  });
});
