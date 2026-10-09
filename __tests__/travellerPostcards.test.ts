/**
 * The living postcards on /traveller: each listed clip has its video and its
 * still in public/travel-clips, at the size the list says (the page
 * reserves that box before anything loads), and names a pin the map has, so
 * no clip is listed for a chapter that can never appear.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { mergeTravelData } from '../lib/travel/model';
import { placesFileSchema } from '../lib/travel/load';
import { POSTCARDS, postcardSrc } from '../lib/travel/postcards';

const publicDir = join(process.cwd(), 'public');
const file = (src: string) => join(publicDir, src);

function videoSize(path: string): [number, number] | null {
  try {
    const out = execFileSync('ffprobe', [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height',
      '-of',
      'csv=p=0',
      path,
    ])
      .toString()
      .trim();
    const [w, h] = out.split(',').map(Number);
    return [w, h];
  } catch {
    return null; // no ffprobe here: the size check is skipped, the rest still runs
  }
}

describe('living postcards', () => {
  const places = mergeTravelData(
    placesFileSchema.parse(JSON.parse(readFileSync('data/travel/places.json', 'utf8'))).places,
    [],
  ).places;
  const pinIds = new Set(places.map((place) => place.id));

  it.each(POSTCARDS.map((card) => [card.pinId, card] as const))('%s has its files', (_, card) => {
    for (const ext of ['mp4', 'webp'] as const) {
      const path = file(postcardSrc(card, ext));
      expect(existsSync(path)).toBe(true);
      // Small enough for a page that loads one at a time.
      expect(statSync(path).size).toBeLessThan(1.5 * 1024 * 1024);
    }
    const size = videoSize(file(postcardSrc(card, 'mp4')));
    if (size) expect(size).toEqual([card.width, card.height]);
  });

  it('names pins the map has, once each', () => {
    expect(POSTCARDS.filter((card) => !pinIds.has(card.pinId)).map((c) => c.pinId)).toEqual([]);
    expect(new Set(POSTCARDS.map((c) => c.pinId)).size).toBe(POSTCARDS.length);
  });
});
