/**
 * /traveller takes the look of whichever homepage design is live
 * (app/traveller/traveller.css, keyed on data-home). A design block missing a
 * token silently inherits midnight's value for it - a sky-blue pin on
 * terracotta's cream, say - so every design must set every colour token the
 * base defines, and every design in HOME_DESIGNS must have a block.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HOME_VARIANTS } from '../lib/featureFlags';

const css = readFileSync(join(__dirname, '../app/traveller/traveller.css'), 'utf8');

function tokensIn(selector: string): Set<string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) return new Set();
  const body = css.slice(start, css.indexOf('}', start));
  return new Set(Array.from(body.matchAll(/(--tv-[a-z-]+):/g), (m) => m[1]));
}

const base = tokensIn('.traveller');
// Fonts and weight default to the site's own and are only set where a design differs.
const colours = Array.from(base).filter((token) => !/display|body|label|title-weight/.test(token));

describe('traveller themes', () => {
  it('define the base tokens', () => {
    expect(colours.length).toBeGreaterThan(20);
  });

  it.each(HOME_VARIANTS.filter((name) => name !== 'midnight'))(
    '%s sets every colour token',
    (name) => {
      const tokens = tokensIn(`html[data-home='${name}'] .traveller`);
      expect(colours.filter((token) => !tokens.has(token))).toEqual([]);
    },
  );

  it('midnight dark sets every colour token it does not share with the hero', () => {
    const tokens = tokensIn('.dark .traveller');
    const heroOnly = ['--tv-hero-bg', '--tv-hero-ink', '--tv-hero-muted', '--tv-kicker'];
    expect(colours.filter((token) => !heroOnly.includes(token) && !tokens.has(token))).toEqual([]);
  });
});
