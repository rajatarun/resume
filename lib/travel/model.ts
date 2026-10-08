/**
 * The /traveller data model: what goes into the map, and how it becomes pins.
 *
 * Two sources:
 *   - data/travel/places.json, in this repo: places with no trip attached
 *     (read off the Google Photos heat map, plus landmarks named from the
 *     journal);
 *   - the travel journal, kept in the content API
 *     (rajatarun/ai-content-orchestrator) and fetched at build time from its
 *     GET /site/travel (scripts/sync-travel.mjs). That route is the journal
 *     with every date removed, so nothing here ever has a date to show.
 *
 * A trip's place within MERGE_KM of a known pin in the same country is that
 * pin (a trip's "San Francisco" is the heat map's "San Francisco Bay Area";
 * an unnamed point beside a national park is that park). A place with no city takes
 * its region's name; one with neither, or with no coordinates, is not pinned,
 * though its trip still lists it. Nothing is guessed.
 *
 * Pure and dependency-free, so its helpers can ship to the browser.
 * Validation is lib/travel/load.ts's job.
 */

/** A place as the data gives it. Any field may be missing or null. */
export interface RawPlace {
  city?: string | null;
  region?: string | null;
  country?: string | null;
  /** ISO 3166-1 alpha-2, upper-cased by the loader. */
  countryCode?: string | null;
  lat?: number | null;
  lng?: number | null;
  /** places.json only: what kind of pin it is. */
  kind?: 'city' | 'nature' | null;
  /**
   * places.json only: how far away a trip's place still lands on this pin,
   * when that is more than MERGE_KM. Fairbanks takes every Alaska trip.
   */
  radiusKm?: number | null;
}

/** One trip from GET /site/travel. No dates: the API never sends them. */
export interface PublicTrip {
  /** Opaque and stable; unlike the journal's own ids, it says nothing about when. */
  key: string;
  title?: string | null;
  tripType?: string | null;
  summary?: string | null;
  highlights?: string[] | null;
  places: RawPlace[];
  posts?: { url: string; description?: string | null; isCover?: boolean | null }[] | null;
}

/** A trip as the page shows it, with its places resolved to pins. */
export interface JournalTrip {
  key: string;
  title: string;
  tripType: string | null;
  summary: string | null;
  highlights: string[];
  /** Pins this trip passed through, in its own order. */
  placeIds: string[];
  /** Every country it names, pinned or not, so the country filter finds it. */
  countries: string[];
  /** Instagram posts for its photos, cover first. Only well-formed post links. */
  posts: { url: string; description: string; isCover: boolean }[];
}

export interface TravelPlace {
  id: string;
  name: string;
  /** State, province or region, as given; "" when unknown. */
  region: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  kind: 'city' | 'nature';
  lat: number;
  lng: number;
  /** How far away a place still lands here (at least MERGE_KM). */
  radiusKm: number;
  /** Keys of the trips that passed through here. */
  tripKeys: string[];
}

/** Two names for one pin when they are this close: a city and its metro area. */
export const MERGE_KM = 30;

const NATURE_TRIP_TYPES = new Set(['nature', 'beach', 'mountains']);

export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function slug(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

type Located = RawPlace & { countryCode: string; lat: number; lng: number };

function located(place: RawPlace): place is Located {
  return Boolean(
    place.countryCode && typeof place.lat === 'number' && typeof place.lng === 'number',
  );
}

/**
 * A public Instagram post or reel. The page renders these as links, so
 * anything else (another site, a javascript: URL) is dropped here too, even
 * though the API already filters them.
 */
const INSTAGRAM_POST = /^https:\/\/(www\.)?instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/?$/;

export function isInstagramPost(url: unknown): url is string {
  return typeof url === 'string' && INSTAGRAM_POST.test(url);
}

/**
 * Every pin and every trip: the baseline places, then each trip's places
 * merged in. Returns what was skipped too, so the build and the tests can say
 * why a place has no pin.
 */
export function mergeTravelData(
  baseline: readonly RawPlace[],
  journal: readonly PublicTrip[],
): { places: TravelPlace[]; trips: JournalTrip[]; skipped: string[] } {
  const places: TravelPlace[] = [];
  const skipped: string[] = [];
  const ids = new Set<string>();

  const nearestPin = (place: Located) =>
    places.find((p) => p.country === place.countryCode && distanceKm(p, place) <= p.radiusKm);

  function create(place: Located, name: string, kind: TravelPlace['kind']): TravelPlace {
    const base = `${place.countryCode.toLowerCase()}-${slug(name)}`;
    let id = base;
    for (let n = 2; ids.has(id); n++) id = `${base}-${n}`;
    ids.add(id);
    const created: TravelPlace = {
      id,
      name,
      region: place.region ?? '',
      country: place.countryCode,
      kind,
      lat: place.lat,
      lng: place.lng,
      radiusKm: Math.max(MERGE_KM, place.radiusKm ?? 0),
      tripKeys: [],
    };
    places.push(created);
    return created;
  }

  for (const place of baseline) {
    if (located(place) && place.city) {
      if (!nearestPin(place)) create(place, place.city, place.kind ?? 'city');
    } else {
      skipped.push(
        `places.json: ${place.city ?? '(no name)'} needs a city, country code and coordinates`,
      );
    }
  }

  const trips: JournalTrip[] = [];
  const seen = new Set<string>();
  for (const trip of journal) {
    if (seen.has(trip.key)) continue;
    seen.add(trip.key);
    const title = trip.title ?? trip.places.find((p) => p.city)?.city ?? 'A trip';
    const kind = NATURE_TRIP_TYPES.has(trip.tripType ?? '') ? 'nature' : 'city';
    const placeIds: string[] = [];
    for (const place of trip.places) {
      const label = place.city ?? place.region ?? 'a place';
      if (!located(place)) {
        skipped.push(`"${title}": ${label} has no country code or coordinates`);
        continue;
      }
      const name = place.city ?? place.region;
      const pin = nearestPin(place) ?? (name ? create(place, name, kind) : null);
      if (!pin) {
        skipped.push(`"${title}": a place with no city or region is too vague to pin`);
        continue;
      }
      if (!pin.tripKeys.includes(trip.key)) pin.tripKeys.push(trip.key);
      if (!placeIds.includes(pin.id)) placeIds.push(pin.id);
    }
    trips.push({
      key: trip.key,
      title,
      tripType: trip.tripType ?? null,
      summary: trip.summary ?? null,
      highlights: trip.highlights ?? [],
      placeIds,
      countries: Array.from(
        new Set(trip.places.flatMap((p) => (p.countryCode ? [p.countryCode] : []))),
      ),
      posts: (trip.posts ?? [])
        .filter((post) => isInstagramPost(post.url))
        .map((post) => ({
          url: post.url,
          description: post.description ?? 'Photo on Instagram',
          isCover: post.isCover === true,
        }))
        .sort((a, b) => Number(b.isCover) - Number(a.isCover)),
    });
  }

  return { places, trips, skipped };
}

/** Census-style regions, so the US list reads as six groups instead of thirty states. */
const US_REGIONS: Record<string, string> = {
  Washington: 'Pacific Northwest & Rockies',
  Oregon: 'Pacific Northwest & Rockies',
  Idaho: 'Pacific Northwest & Rockies',
  Montana: 'Pacific Northwest & Rockies',
  Wyoming: 'Pacific Northwest & Rockies',
  Colorado: 'Pacific Northwest & Rockies',
  Alaska: 'Pacific Northwest & Rockies',
  California: 'California & the Southwest',
  Nevada: 'California & the Southwest',
  Arizona: 'California & the Southwest',
  Utah: 'California & the Southwest',
  'New Mexico': 'California & the Southwest',
  Hawaii: 'California & the Southwest',
  Texas: 'Texas & the Gulf',
  Louisiana: 'Texas & the Gulf',
  Oklahoma: 'Texas & the Gulf',
  Mississippi: 'Texas & the Gulf',
  Alabama: 'Texas & the Gulf',
  Illinois: 'Midwest & Mid-South',
  Missouri: 'Midwest & Mid-South',
  Arkansas: 'Midwest & Mid-South',
  Tennessee: 'Midwest & Mid-South',
  Kentucky: 'Midwest & Mid-South',
  Michigan: 'Midwest & Mid-South',
  Ohio: 'Midwest & Mid-South',
  Indiana: 'Midwest & Mid-South',
  Wisconsin: 'Midwest & Mid-South',
  Minnesota: 'Midwest & Mid-South',
  Iowa: 'Midwest & Mid-South',
  Kansas: 'Midwest & Mid-South',
  Nebraska: 'Midwest & Mid-South',
  'North Dakota': 'Midwest & Mid-South',
  'South Dakota': 'Midwest & Mid-South',
  'New York': 'Northeast',
  'New Jersey': 'Northeast',
  Pennsylvania: 'Northeast',
  'District of Columbia': 'Northeast',
  Maryland: 'Northeast',
  Delaware: 'Northeast',
  Massachusetts: 'Northeast',
  Connecticut: 'Northeast',
  'Rhode Island': 'Northeast',
  Vermont: 'Northeast',
  'New Hampshire': 'Northeast',
  Maine: 'Northeast',
  Virginia: 'Southeast',
  'West Virginia': 'Southeast',
  'North Carolina': 'Southeast',
  'South Carolina': 'Southeast',
  Georgia: 'Southeast',
  Florida: 'Southeast',
  'Puerto Rico': 'Southeast',
};

/** The heading a place is listed under: a US region, else its country's own region, else the country. */
export function listGroupOf(place: TravelPlace, countryName: (code: string) => string): string {
  if (place.country === 'US') return US_REGIONS[place.region] ?? 'Elsewhere in the US';
  return place.region
    ? `${place.region}, ${countryName(place.country)}`
    : countryName(place.country);
}

/** Places grouped for the list, groups in the order their first place appears. */
export function groupPlaces(
  places: readonly TravelPlace[],
  countryName: (code: string) => string,
): { group: string; places: TravelPlace[] }[] {
  const groups = new Map<string, TravelPlace[]>();
  for (const place of places) {
    const key = listGroupOf(place, countryName);
    groups.set(key, [...(groups.get(key) ?? []), place]);
  }
  return Array.from(groups, ([group, items]) => ({ group, places: items }));
}

/** Headline numbers for a set of places and the trips shown with them. */
export function travelStats(
  places: readonly TravelPlace[],
  trips: readonly JournalTrip[],
): { places: number; countries: number; regions: number; trips: number } {
  return {
    places: places.length,
    countries: new Set(places.map((place) => place.country)).size,
    regions: new Set(
      places.filter((p) => p.region).map((place) => `${place.country}:${place.region}`),
    ).size,
    trips: trips.length,
  };
}

/** A café or restaurant from GET /site/travel's `dining`: no visit counts, by design. */
export interface DiningPlace {
  name: string;
  category: 'cafe' | 'restaurant' | 'other dining';
  city?: string | null;
  /** As the card export wrote it: often a state abbreviation ("TX"), often missing. */
  region?: string | null;
  /** Tarun's own rating, 1-5, when he reviewed it. */
  rating?: number | null;
  review?: string | null;
}

/** A café or restaurant as the page shows it: on a pin when its city is one. */
export interface DiningSpot {
  name: string;
  category: DiningPlace['category'];
  city: string | null;
  pinId: string | null;
  rating: number | null;
  review: string | null;
}

/**
 * Towns that belong to a pin of another name. Card exports name the suburb
 * (Plano, Frisco), the map has the metro area. Keys are pin names.
 */
const METRO_TOWNS: Record<string, readonly string[]> = {
  'Dallas–Fort Worth': [
    'dallas',
    'fort worth',
    'plano',
    'allen',
    'mckinney',
    'frisco',
    'irving',
    'the colony',
    'princeton',
    'richardson',
    'arlington',
    'garland',
    'carrollton',
    'lewisville',
    'denton',
    'grapevine',
    'southlake',
    'addison',
    'prosper',
    'wylie',
    'grand prairie',
    'mesquite',
    'rockwall',
    'little elm',
    'celina',
    'coppell',
    'flower mound',
    'murphy',
    'sachse',
  ],
  'Los Angeles': [
    'glendale',
    'pasadena',
    'burbank',
    'santa monica',
    'long beach',
    'beverly hills',
    'west hollywood',
    'culver city',
    'venice',
    'anaheim',
  ],
  'San Francisco Bay Area': [
    'san francisco',
    'oakland',
    'san jose',
    'berkeley',
    'palo alto',
    'mountain view',
    'sunnyvale',
    'santa clara',
    'fremont',
    'cupertino',
  ],
  'New York City': ['new york', 'brooklyn', 'manhattan', 'queens', 'jersey city', 'hoboken'],
};

const US_STATE_CODES: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  DC: 'District of Columbia',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
};

/** The pin a café's city belongs to, or null. A stated region must agree with the pin's. */
export function pinForCity(
  city: string | null | undefined,
  region: string | null | undefined,
  places: readonly TravelPlace[],
): TravelPlace | null {
  if (!city) return null;
  const town = city.trim().toLowerCase();
  const state = region ? (US_STATE_CODES[region.trim().toUpperCase()] ?? region.trim()) : null;
  const fits = (pin: TravelPlace) => !state || pin.region === state;
  const direct = places.find((pin) => pin.name.toLowerCase() === town && fits(pin));
  if (direct) return direct;
  const metro = Object.entries(METRO_TOWNS).find(([, towns]) => towns.includes(town))?.[0];
  return places.find((pin) => pin.name === metro && fits(pin)) ?? null;
}

/** Every café and restaurant, on its pin where the city allows. */
export function placeDining(
  dining: readonly DiningPlace[],
  places: readonly TravelPlace[],
): DiningSpot[] {
  return dining.map((spot) => ({
    name: spot.name,
    category: spot.category,
    city: spot.city ?? null,
    pinId: pinForCity(spot.city, spot.region, places)?.id ?? null,
    rating: spot.rating ?? null,
    review: spot.review ?? null,
  }));
}
