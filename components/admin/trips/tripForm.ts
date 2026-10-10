/**
 * The trip editor's logic, kept apart from the form so it can be tested.
 *
 * A trip is one document in the content API (GET/POST /admin/travel, PUT and
 * DELETE /admin/travel/{id}): its own fields, and for each town what I saw,
 * ate and where I stayed. Dates live here, in the admin only; the website
 * gets the trip without them.
 */

export const TRIP_TYPES = [
  'city',
  'nature',
  'mountains',
  'beach',
  'road-trip',
  'culture',
  'mixed',
] as const;
export const FOOD_CATEGORIES = ['cafe', 'restaurant', 'other dining'] as const;
export const STAY_TYPES = ['airbnb', 'hotel', 'other'] as const;
const TRIP_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export interface Visit {
  name: string;
  note: string | null;
}

export interface Food {
  name: string;
  category: (typeof FOOD_CATEGORIES)[number];
  rating: number | null;
  review: string | null;
  note: string | null;
  score: number | null;
}

export interface Stay {
  name: string | null;
  type: (typeof STAY_TYPES)[number];
  rating: number | null;
  review: string | null;
  checkIn: string | null;
  nights: number | null;
}

export interface TripPlace {
  city: string | null;
  region: string | null;
  country?: string | null;
  countryCode: string | null;
  lat: number | null;
  lng: number | null;
  visited: Visit[];
  food: Food[];
  stays: Stay[];
}

export interface Trip {
  id: string;
  title: string | null;
  startDate: string | null;
  endDate: string | null;
  tripType: string | null;
  summary: string | null;
  highlights: string[];
  places: TripPlace[];
  /** Kept as uploaded: Ask Photos' photo list, Instagram links included. */
  photos: unknown[];
}

export const emptyVisit = (): Visit => ({ name: '', note: null });
export const emptyFood = (): Food => ({
  name: '',
  category: 'restaurant',
  rating: null,
  review: null,
  note: null,
  score: null,
});
export const emptyStay = (): Stay => ({
  name: null,
  type: 'airbnb',
  rating: null,
  review: null,
  checkIn: null,
  nights: null,
});
export const emptyPlace = (): TripPlace => ({
  city: null,
  region: null,
  countryCode: 'US',
  lat: null,
  lng: null,
  visited: [],
  food: [],
  stays: [],
});
export const emptyTrip = (): Trip => ({
  id: '',
  title: null,
  startDate: null,
  endDate: null,
  tripType: null,
  summary: null,
  highlights: [],
  places: [emptyPlace()],
  photos: [],
});

/** A trip as the API returns it, with every list present so the form can map over it. */
export function normalizeTrip(raw: Partial<Trip> & { id: string }): Trip {
  return {
    ...emptyTrip(),
    ...raw,
    highlights: raw.highlights ?? [],
    photos: raw.photos ?? [],
    places: (raw.places ?? []).map((place) => ({
      ...emptyPlace(),
      ...place,
      visited: place.visited ?? [],
      food: place.food ?? [],
      stays: place.stays ?? [],
    })),
  };
}

/** "2024-09" + "Alaska Fall Lights" -> "2024-09-alaska-fall-lights", the journal's own pattern. */
export function suggestId(title: string | null, startDate: string | null): string {
  const slug = (title ?? 'trip')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const month = startDate && ISO_DATE.test(startDate) ? startDate.slice(0, 7) : null;
  return [month, slug || 'trip'].filter(Boolean).join('-');
}

const clean = (value: string | null | undefined): string | null => {
  const text = (value ?? '').trim();
  return text ? text : null;
};

/**
 * What Save sends: text trimmed (empty becomes null), blank rows dropped (a
 * visit or a meal with no name, a stay with nothing filled in), highlights
 * without empty lines, and the country code upper-cased.
 */
export function toPayload(trip: Trip): Trip {
  return {
    ...trip,
    id: trip.id.trim(),
    title: clean(trip.title),
    startDate: clean(trip.startDate),
    endDate: clean(trip.endDate),
    tripType: clean(trip.tripType),
    summary: clean(trip.summary),
    highlights: trip.highlights.map((h) => h.trim()).filter(Boolean),
    places: trip.places.map((place) => ({
      ...place,
      city: clean(place.city),
      region: clean(place.region),
      countryCode: clean(place.countryCode)?.toUpperCase() ?? null,
      visited: place.visited
        .map((v) => ({ name: v.name.trim(), note: clean(v.note) }))
        .filter((v) => v.name),
      food: place.food
        .map((f) => ({ ...f, name: f.name.trim(), review: clean(f.review), note: clean(f.note) }))
        .filter((f) => f.name),
      stays: place.stays
        .map((s) => ({
          ...s,
          name: clean(s.name),
          review: clean(s.review),
          checkIn: clean(s.checkIn),
        }))
        .filter((s) => s.name || s.review || s.rating || s.checkIn || s.nights),
    })),
  };
}

/** What would stop the API saving it, in words, with where. Empty when it is fine. */
export function validateTrip(trip: Trip): string[] {
  const problems: string[] = [];
  if (!TRIP_ID.test(trip.id.trim())) {
    problems.push(
      'Trip id: letters, digits, dots, dashes and underscores, starting with a letter or digit.',
    );
  }
  for (const [label, value] of [
    ['Start date', trip.startDate],
    ['End date', trip.endDate],
  ] as const) {
    if (clean(value) && !ISO_DATE.test(value!.trim())) problems.push(`${label}: use YYYY-MM-DD.`);
  }
  if (trip.startDate && trip.endDate && trip.endDate < trip.startDate) {
    problems.push('End date is before the start date.');
  }
  trip.places.forEach((place, i) => {
    const where = `Town ${i + 1}${place.city ? ` (${place.city})` : ''}`;
    if (clean(place.countryCode) && !/^[A-Za-z]{2}$/.test(place.countryCode!.trim())) {
      problems.push(`${where}: country code is two letters, like US.`);
    }
    if (place.lat !== null && (place.lat < -90 || place.lat > 90))
      problems.push(`${where}: latitude is -90 to 90.`);
    if (place.lng !== null && (place.lng < -180 || place.lng > 180))
      problems.push(`${where}: longitude is -180 to 180.`);
    if ((place.lat === null) !== (place.lng === null))
      problems.push(`${where}: give both latitude and longitude, or neither.`);
    place.stays.forEach((stay, j) => {
      if (clean(stay.checkIn) && !ISO_DATE.test(stay.checkIn!.trim())) {
        problems.push(`${where}, stay ${j + 1}: check-in is YYYY-MM-DD.`);
      }
      if (stay.nights !== null && (stay.nights < 1 || stay.nights > 365)) {
        problems.push(`${where}, stay ${j + 1}: nights is 1 to 365.`);
      }
    });
  });
  return problems;
}

/** One trip from an uploaded file: a trip object, or the only trip in {trips: [...]}. */
export function tripFromFile(json: unknown): Trip {
  const one =
    json && typeof json === 'object' && 'id' in json
      ? json
      : json &&
          typeof json === 'object' &&
          'trips' in json &&
          Array.isArray((json as { trips: unknown[] }).trips)
        ? (json as { trips: unknown[] }).trips.length === 1
          ? (json as { trips: unknown[] }).trips[0]
          : null
        : null;
  if (!one || typeof one !== 'object' || typeof (one as { id?: unknown }).id !== 'string') {
    throw new Error(
      'This file is not one trip. Upload a single trip ({"id": ...}), or use "Upload journal JSON" for many.',
    );
  }
  return normalizeTrip(one as Trip);
}

/** How many things a trip tells, for the trip list. */
export function tripCounts(trip: Trip): {
  towns: number;
  visited: number;
  food: number;
  stays: number;
} {
  return trip.places.reduce(
    (sum, p) => ({
      towns: sum.towns + 1,
      visited: sum.visited + p.visited.length,
      food: sum.food + p.food.length,
      stays: sum.stays + p.stays.length,
    }),
    { towns: 0, visited: 0, food: 0, stays: 0 },
  );
}
