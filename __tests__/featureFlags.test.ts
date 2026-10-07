/**
 * The homepage design is chosen by NEXT_PUBLIC_HOME_VARIANT at build time.
 * Whatever lands in that variable — unset, a typo, stray whitespace from the
 * Amplify console — must resolve to a design that exists, and anything it
 * doesn't recognise must fall back to the default rather than break the build.
 */
import { DEFAULT_HOME_VARIANT, HOME_VARIANTS, resolveHomeVariant } from '../lib/featureFlags';

describe('resolveHomeVariant', () => {
  it('defaults to the terracotta homepage', () => {
    expect(DEFAULT_HOME_VARIANT).toBe('terracotta');
    expect(resolveHomeVariant(undefined)).toBe('terracotta');
    expect(resolveHomeVariant('')).toBe('terracotta');
  });

  it('selects each registered design by name', () => {
    expect(HOME_VARIANTS).toEqual(['midnight', 'terracotta']);
    for (const variant of HOME_VARIANTS) {
      expect(resolveHomeVariant(variant)).toBe(variant);
    }
  });

  it('tolerates case and whitespace from the console', () => {
    expect(resolveHomeVariant(' Midnight \n')).toBe('midnight');
  });

  it('falls back to the default for anything unrecognised', () => {
    expect(resolveHomeVariant('midnite')).toBe('terracotta');
    expect(resolveHomeVariant('classic')).toBe('terracotta');
  });
});
