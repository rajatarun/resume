/**
 * /traveller is built from data/travel/places.json and the travel journal the
 * content API serves without dates (GET /site/travel, fetched at build time
 * into data/travel/generated/). These hold the merge to what the map needs:
 * one pin per place however many trips passed through it, unnamed points
 * landing on the landmark they are next to, nothing pinned without
 * coordinates, only Instagram post links kept, and a journal that does not
 * fit never stopping the build.
 */
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadTravelData } from '../lib/travel/load';
import {
  groupPlaces,
  isInstagramPost,
  mergeTravelData,
  pinForCity,
  placeDining,
  travelStats,
  type PublicTrip,
  type RawPlace,
} from '../lib/travel/model';

const name = (code: string) => (code === 'US' ? 'United States' : code === 'IN' ? 'India' : code);

function fixture(files: Record<string, unknown>): string {
  const dir = mkdtempSync(join(tmpdir(), 'travel-'));
  mkdirSync(join(dir, 'generated'));
  for (const [path, body] of Object.entries(files)) {
    writeFileSync(join(dir, path), typeof body === 'string' ? body : JSON.stringify(body));
  }
  return dir;
}

const yellowstone: RawPlace = {
  city: 'Yellowstone',
  region: 'Wyoming',
  countryCode: 'US',
  lat: 44.428,
  lng: -110.5885,
  kind: 'nature',
};

const trip = (overrides: Partial<PublicTrip> = {}): PublicTrip => ({
  key: 'a1b2c3',
  title: 'Canyon Road Trip',
  tripType: 'mixed',
  summary: 'Red rock and long desert roads.',
  highlights: ['Desert sunrise'],
  places: [
    { city: 'Las Vegas', region: 'Nevada', countryCode: 'US', lat: 36.2, lng: -115.1 },
    // No city: Ask Photos only knew the point. It is Yellowstone, 3 km away.
    { city: null, region: 'Wyoming', countryCode: 'US', lat: 44.4, lng: -110.5 },
  ],
  posts: [
    {
      url: 'https://www.instagram.com/p/Example123/',
      description: 'A canyon at dawn',
      isCover: true,
    },
    { url: 'javascript:alert(1)', description: 'Not a post', isCover: false },
  ],
  ...overrides,
});

describe('the real places.json', () => {
  const { places, skipped } = loadTravelData(fixture({ 'places.json': readRealPlaces() }));

  function readRealPlaces() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../data/travel/places.json');
  }

  it('loads, with the United States in it', () => {
    expect(skipped).toEqual([]);
    expect(places.some((place) => place.country === 'US')).toBe(true);
  });

  it('gives every pin a unique id and a real coordinate', () => {
    expect(new Set(places.map((p) => p.id)).size).toBe(places.length);
    for (const place of places) {
      expect(Math.abs(place.lat)).toBeLessThanOrEqual(90);
      // US pins: catches a swapped lat/lng or a dropped minus sign.
      if (place.country === 'US') expect(place.lng).toBeLessThan(-60);
    }
  });

  it('puts every US place under one of the regions the list groups by', () => {
    const groups = groupPlaces(
      places.filter((p) => p.country === 'US'),
      name,
    ).map((g) => g.group);
    expect(groups).not.toContain('Elsewhere in the US');
  });
});

describe('merging the journal into pins', () => {
  it('reuses a nearby pin, names a new one by its city, and links both to the trip', () => {
    const { places, trips } = mergeTravelData([yellowstone], [trip()]);
    expect(places.map((p) => p.name)).toEqual(['Yellowstone', 'Las Vegas']);
    expect(places.every((p) => p.tripKeys.includes('a1b2c3'))).toBe(true);
    expect(trips[0].placeIds).toEqual(['us-las-vegas', 'us-yellowstone']);
  });

  it('names a place with no city after its region, and does not pin one with neither', () => {
    const { places, trips, skipped } = mergeTravelData(
      [],
      [
        trip({
          key: 'k',
          title: 'Green Hills Weekend',
          places: [
            { city: null, region: 'Vermont', countryCode: 'US', lat: 44.0, lng: -72.7 },
            { city: null, region: null, countryCode: 'IN', lat: 22.0, lng: 79.0 },
            { city: null, region: null, countryCode: 'US', lat: null, lng: null },
          ],
        }),
      ],
    );
    expect(places.map((p) => p.name)).toEqual(['Vermont']);
    expect(skipped).toEqual([
      '"Green Hills Weekend": a place with no city or region is too vague to pin',
      '"Green Hills Weekend": a place has no country code or coordinates',
    ]);
    // Unpinned, it still counts as a trip to India for the country filter.
    expect(trips[0].countries).toEqual(['US', 'IN']);
  });

  it('keeps only Instagram post links, cover first', () => {
    const { trips } = mergeTravelData([], [trip()]);
    expect(trips[0].posts).toEqual([
      {
        url: 'https://www.instagram.com/p/Example123/',
        description: 'A canyon at dawn',
        isCover: true,
      },
    ]);
    expect(isInstagramPost('https://www.instagram.com/reel/Cx1_-z/')).toBe(true);
    expect(isInstagramPost('https://evil.example/instagram.com/p/x/')).toBe(false);
  });

  it('lets a pin with a radius take places far beyond MERGE_KM', () => {
    const fairbanks: RawPlace = {
      city: 'Fairbanks',
      region: 'Alaska',
      countryCode: 'US',
      lat: 64.84,
      lng: -147.72,
      radiusKm: 450,
    };
    const { places } = mergeTravelData(
      [fairbanks],
      [
        trip({
          key: 'north',
          places: [
            { city: null, region: 'Alaska', countryCode: 'US', lat: 67.2, lng: -150.2 },
            { city: null, region: 'Alaska', countryCode: 'US', lat: 64.0, lng: -151.0 },
          ],
        }),
      ],
    );
    expect(places.map((p) => [p.name, p.tripKeys])).toEqual([['Fairbanks', ['north']]]);
  });

  it('counts places, regions, countries and trips', () => {
    const { places, trips } = mergeTravelData([yellowstone], [trip()]);
    expect(travelStats(places, trips)).toEqual({ places: 2, countries: 1, regions: 2, trips: 1 });
  });
});

describe('loading the fetched journal', () => {
  const places = { places: [yellowstone] };

  it('reads what GET /site/travel returns, ignoring fields it does not know', () => {
    const dir = fixture({
      'places.json': places,
      'generated/site-travel.json': { trips: [{ ...trip(), somethingNew: 1 }] },
    });
    const { trips, skipped } = loadTravelData(dir);
    expect(trips.map((t) => t.title)).toEqual(['Canyon Road Trip']);
    expect(skipped).toEqual([]);
  });

  it('builds without it, and drops a trip that does not fit rather than failing', () => {
    expect(loadTravelData(fixture({ 'places.json': places })).trips).toEqual([]);
    const dir = fixture({
      'places.json': places,
      'generated/site-travel.json': { trips: [trip(), { title: 'No key' }] },
    });
    const { trips, skipped } = loadTravelData(dir);
    expect(trips).toHaveLength(1);
    expect(skipped[0]).toMatch(/^journal trip 1: key:/);
    expect(
      loadTravelData(fixture({ 'places.json': places, 'generated/site-travel.json': '{' })).trips,
    ).toEqual([]);
  });

  it('fails the build, naming the file, when places.json is wrong', () => {
    const dir = fixture({ 'places.json': { places: [{ city: 'X', countryCode: 'USA' }] } });
    expect(() => loadTravelData(dir)).toThrow(/places\.json: places\.0\.countryCode/);
  });
});

describe('cafés and restaurants', () => {
  const { places } = mergeTravelData(
    [
      { city: 'Dallas–Fort Worth', region: 'Texas', countryCode: 'US', lat: 32.78, lng: -96.8 },
      { city: 'Los Angeles', region: 'California', countryCode: 'US', lat: 34.05, lng: -118.24 },
      { city: 'Detroit', region: 'Michigan', countryCode: 'US', lat: 42.33, lng: -83.05 },
    ],
    [],
  );
  const pinName = (city: string | null, region: string | null = null) =>
    pinForCity(city, region, places)?.name ?? null;

  it('puts a suburb on its metro pin and a named city on its own', () => {
    expect(pinName('Richardson', 'TX')).toBe('Dallas–Fort Worth');
    expect(pinName('The Colony')).toBe('Dallas–Fort Worth');
    expect(pinName('Glendale')).toBe('Los Angeles');
    expect(pinName('detroit', 'MI')).toBe('Detroit');
  });

  it('refuses a match the stated region contradicts, and leaves unknown cities unpinned', () => {
    expect(pinName('Glendale', 'AZ')).toBeNull();
    expect(pinName('Nashville')).toBeNull();
    expect(pinName(null)).toBeNull();
  });

  it('keeps every place, pinned or not', () => {
    const spots = placeDining(
      [
        { name: 'Harbor Grill', category: 'restaurant', city: 'Dallas', region: null },
        { name: 'Corner Bean', category: 'cafe', city: null, region: null },
      ],
      places,
    );
    expect(spots.map((s) => [s.name, s.pinId])).toEqual([
      ['Harbor Grill', 'us-dallas-fort-worth'],
      ['Corner Bean', null],
    ]);
  });

  it('reads them from the fetched file, dropping an entry that does not fit', () => {
    const dir = fixture({
      'places.json': {
        places: [
          { city: 'Detroit', region: 'Michigan', countryCode: 'US', lat: 42.33, lng: -83.05 },
        ],
      },
      'generated/site-travel.json': {
        trips: [],
        dining: [
          { name: 'Barista', category: 'cafe', city: 'Detroit', region: null },
          { name: 'Somewhere', category: 'fast food', city: null, region: null },
        ],
      },
    });
    const { dining, skipped } = loadTravelData(dir);
    expect(dining).toEqual([
      {
        name: 'Barista',
        category: 'cafe',
        city: 'Detroit',
        pinId: 'us-detroit',
        rating: null,
        review: null,
      },
    ]);
    expect(skipped[0]).toMatch(/^dining place 1: category:/);
  });
});
