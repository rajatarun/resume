/**
 * The footer has to sit at the bottom of the viewport on a short page.
 *
 * `body` carried `min-h-screen`, which makes the body tall but pushes nothing
 * down. On any page whose content does not fill the screen the footer sat
 * immediately after the content with the page background running on beneath
 * it: measured in a real browser at 1440x900, /admin left 519px of dead space
 * below the footer and /contact 449px. Long pages looked fine, which is why
 * it survived — it only shows on the short ones.
 *
 * The fix is the standard sticky-footer column: `body` is a flex column and
 * `main` grows. These pin both halves, because either alone does nothing.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const layout = readFileSync(join(__dirname, '..', 'app', 'layout.tsx'), 'utf8');

function classesOf(tag: 'body' | 'main'): string {
  const match = layout.match(new RegExp(`<${tag}[^>]*className="([^"]*)"`));
  if (!match) throw new Error(`no <${tag}> with a className in app/layout.tsx`);
  return match[1];
}

describe('the root layout pins the footer to the bottom', () => {
  it('makes the body a column that is at least a screen tall', () => {
    const body = classesOf('body');
    expect(body).toContain('min-h-screen');
    expect(body).toContain('flex');
    expect(body).toContain('flex-col');
  });

  it('lets main take the leftover height', () => {
    // Without this the column is tall and the footer still sits under the
    // content: min-h-screen on its own was exactly that state.
    expect(classesOf('main')).toContain('flex-1');
  });

  it('keeps main a centred, width-capped column', () => {
    // flex-1 governs height. The horizontal constraints have to survive it,
    // or the fix trades a footer gap for full-bleed text.
    const main = classesOf('main');
    expect(main).toContain('mx-auto');
    expect(main).toContain('max-w-6xl');
  });
});
