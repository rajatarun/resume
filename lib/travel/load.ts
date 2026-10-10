/**
 * Reads the /traveller data at build time and merges it into pins and trips
 * (lib/travel/model.ts):
 *
 *   - data/travel/places.json, in this repo;
 *   - data/travel/generated/site-travel.json, the content API's undated
 *     journal and its cafés and restaurants (no visit counts), fetched by
 *     scripts/sync-travel.mjs before the build (missing is fine: the map then
 *     shows places.json alone).
 *
 * places.json is ours, so a mistake in it fails the build, naming the file
 * and the field. The fetched journal is someone else's response: a trip that
 * does not fit is dropped and logged, never the reason the site stops
 * building.
 *
 * Server only: uses the file system.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import {
  mergeTravelData,
  placeDining,
  type DiningPlace,
  type DiningSpot,
  type JournalTrip,
  type PublicTrip,
  type RawPlace,
  type TravelPlace,
} from './model';

const nullableString = z.string().trim().nullish();

export const placeSchema: z.ZodType<RawPlace, z.ZodTypeDef, unknown> = z.object({
  city: nullableString,
  region: nullableString,
  country: nullableString,
  countryCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/, 'countryCode must be ISO 3166 alpha-2, like US')
    .transform((code) => code.toUpperCase())
    .nullish(),
  lat: z.number().min(-90).max(90).nullish(),
  lng: z.number().min(-180).max(180).nullish(),
  kind: z.enum(['city', 'nature']).nullish(),
  radiusKm: z.number().positive().max(1000).nullish(),
});

const visitSchema = z.object({
  name: z.string().trim().min(1),
  note: nullableString.transform((v) => v ?? null),
});
const foodSchema = z.object({
  name: z.string().trim().min(1),
  category: z.enum(['cafe', 'restaurant', 'other dining']).catch('restaurant'),
  rating: z
    .number()
    .int()
    .min(1)
    .max(5)
    .nullish()
    .transform((v) => v ?? null),
  review: z
    .string()
    .trim()
    .max(2000)
    .nullish()
    .transform((v) => v ?? null),
  note: z
    .string()
    .trim()
    .max(500)
    .nullish()
    .transform((v) => v ?? null),
  score: z
    .number()
    .min(1)
    .max(5)
    .nullish()
    .transform((v) => v ?? null),
});
const staySchema = z.object({
  name: nullableString.transform((v) => v ?? null),
  type: z.enum(['airbnb', 'hotel', 'other']).catch('other'),
  rating: z
    .number()
    .int()
    .min(1)
    .max(5)
    .nullish()
    .transform((v) => v ?? null),
  review: z
    .string()
    .trim()
    .max(2000)
    .nullish()
    .transform((v) => v ?? null),
});

/** A trip's place: a map place, plus what I saw, ate and where I stayed there. */
const tripPlaceSchema: z.ZodType<RawPlace, z.ZodTypeDef, unknown> = z.intersection(
  placeSchema,
  z.object({
    visited: z
      .array(visitSchema)
      .nullish()
      .transform((v) => v ?? []),
    food: z
      .array(foodSchema)
      .nullish()
      .transform((v) => v ?? []),
    stays: z
      .array(staySchema)
      .nullish()
      .transform((v) => v ?? []),
  }),
);

export const placesFileSchema = z.object({
  source: z.string().optional(),
  places: z.array(placeSchema),
});

/** One trip of GET /site/travel. Unknown keys are ignored; dates are never read. */
export const publicTripSchema: z.ZodType<PublicTrip, z.ZodTypeDef, unknown> = z.object({
  key: z.string().min(1),
  title: nullableString,
  tripType: nullableString,
  summary: nullableString,
  highlights: z.array(z.string()).nullish(),
  places: z.array(tripPlaceSchema).default([]),
  posts: z
    .array(
      z.object({
        url: z.string(),
        description: nullableString,
        isCover: z.boolean().nullish(),
      }),
    )
    .nullish(),
});

/** One café or restaurant of GET /site/travel's `dining`. */
export const diningSchema: z.ZodType<DiningPlace, z.ZodTypeDef, unknown> = z.object({
  name: z.string().trim().min(1),
  category: z.enum(['cafe', 'restaurant', 'other dining']),
  city: nullableString,
  region: nullableString,
  rating: z.number().int().min(1).max(5).nullish(),
  review: z.string().trim().max(2000).nullish(),
  note: z.string().trim().max(500).nullish(),
  score: z.number().min(1).max(5).nullish(),
});

export const TRAVEL_DIR = join(process.cwd(), 'data', 'travel');

function parseJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`${path} is not valid JSON: ${(error as Error).message}`);
  }
}

/** Each item of a list that fits the schema, and a note for each one that does not. */
function each<T>(
  list: unknown,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  label: string,
  dropped: string[],
): T[] {
  if (list === undefined) return [];
  if (!Array.isArray(list)) {
    dropped.push(`${label}: not a list`);
    return [];
  }
  return list.flatMap((raw, index) => {
    const parsed = schema.safeParse(raw);
    if (parsed.success) return [parsed.data];
    const issue = parsed.error.issues[0];
    dropped.push(`${label} ${index}: ${issue.path.join('.')}: ${issue.message}`);
    return [];
  });
}

/** The fetched journal's trips and dining that fit, and a note for each item that does not. */
function readJournal(path: string): {
  trips: PublicTrip[];
  dining: DiningPlace[];
  dropped: string[];
} {
  const dropped: string[] = [];
  if (!existsSync(path)) return { trips: [], dining: [], dropped };
  let json: { trips?: unknown; dining?: unknown } | null;
  try {
    json = parseJson(path) as typeof json;
  } catch (error) {
    return { trips: [], dining: [], dropped: [(error as Error).message] };
  }
  if (!json || !Array.isArray(json.trips)) {
    return { trips: [], dining: [], dropped: [`${path}: no trips list`] };
  }
  return {
    trips: each(json.trips, publicTripSchema, 'journal trip', dropped),
    dining: each(json.dining, diningSchema, 'dining place', dropped),
    dropped,
  };
}

export function loadTravelData(dir = TRAVEL_DIR): {
  places: TravelPlace[];
  trips: JournalTrip[];
  dining: DiningSpot[];
  skipped: string[];
} {
  const placesPath = join(dir, 'places.json');
  const parsed = placesFileSchema.safeParse(parseJson(placesPath));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(`${placesPath}: ${issue.path.join('.') || '(root)'}: ${issue.message}`);
  }
  const journal = readJournal(join(dir, 'generated', 'site-travel.json'));
  const { places, trips, skipped } = mergeTravelData(parsed.data.places, journal.trips);
  return {
    places,
    trips,
    dining: placeDining(journal.dining, places),
    skipped: [...journal.dropped, ...skipped],
  };
}
