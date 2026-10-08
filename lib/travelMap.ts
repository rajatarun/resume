/**
 * Projects the /traveller map at build time.
 *
 * The page is a static export, so this runs once, in the server component,
 * and the browser receives finished SVG path strings: no map library, no
 * topology files and no projection maths in its JavaScript, and the map is
 * drawn before any script runs. Each country filter on the page is one view
 * here, and the views follow the data: a country appears as soon as any place
 * in data/travel/ is in it.
 *
 * Import it only from server components: d3-geo and the atlases must not
 * reach a client bundle.
 */
import {
  geoAlbersUsa,
  geoArea,
  geoEqualEarth,
  geoMercator,
  geoPath,
  type GeoProjection,
} from 'd3-geo';
import countryCodes from 'i18n-iso-countries';
import { feature } from 'topojson-client';
import { presimplify, simplify } from 'topojson-simplify';
import type { GeometryCollection, Objects, Topology } from 'topojson-specification';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import worldTopology from 'world-atlas/countries-110m.json';
import worldDetailTopology from 'world-atlas/countries-50m.json';
import usTopology from 'us-atlas/states-10m.json';
import type { TravelPlace } from '@/lib/travel/model';

export const MAP_WIDTH = 975;
/** The view the page opens on, when there is anything in it. */
export const DEFAULT_COUNTRY = 'US';

export interface MapShape {
  id: string;
  name: string;
  d: string;
  /** Somewhere in it has a pin. */
  visited: boolean;
}

export interface MapPoint {
  id: string;
  x: number;
  y: number;
}

export interface MapView {
  /** "world", or the country's alpha-2 code. */
  key: string;
  label: string;
  height: number;
  /** The globe's outline (world view only), drawn as the sea. */
  sphere: string | null;
  shapes: MapShape[];
  points: MapPoint[];
}

/**
 * Outlines are simplified before projecting: the paths ship inside the page's
 * HTML (twice, counting the React payload), and at full detail the page was
 * ~590 KB. The thresholds are triangle areas in square degrees, chosen so no
 * removed point would move an edge by more than about a pixel at full width.
 */
const US_SIMPLIFY = 0.003;
const WORLD_SIMPLIFY = 0.1;
/** A single country fills the frame, so it is drawn from the 1:50m atlas, less simplified. */
const COUNTRY_SIMPLIFY = 0.002;
const DIGITS = 0;

const world = simplify(
  presimplify(worldTopology as unknown as Topology<Objects<{}>>),
  WORLD_SIMPLIFY,
) as Topology<{
  countries: GeometryCollection<{ name: string }>;
}>;
const us = simplify(
  presimplify(usTopology as unknown as Topology<Objects<{}>>),
  US_SIMPLIFY,
) as Topology<{
  states: GeometryCollection<{ name: string }>;
}>;

// Antarctica is a fifth of an Equal Earth map, so it stays off until someone is pinned there.
const ANTARCTICA = '010';
const allCountries = (
  feature(world, world.objects.countries) as FeatureCollection<Geometry, { name: string }>
).features;

// Built only if a country other than the US has pins.
let detailedCountries: Feature<Geometry, { name: string }>[] | null = null;
function countriesInDetail(): Feature<Geometry, { name: string }>[] {
  if (!detailedCountries) {
    const detail = simplify(
      presimplify(worldDetailTopology as unknown as Topology<Objects<{}>>),
      COUNTRY_SIMPLIFY,
    ) as Topology<{
      countries: GeometryCollection<{ name: string }>;
    }>;
    detailedCountries = (
      feature(detail, detail.objects.countries) as FeatureCollection<Geometry, { name: string }>
    ).features;
  }
  return detailedCountries;
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

/** "United States" for "US"; the code itself if it is not a country. */
export function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** world-atlas names its shapes by ISO numeric code ("840"), the data by alpha-2 ("US"). */
function numericCode(alpha2: string): string | undefined {
  return countryCodes.alpha2ToNumeric(alpha2);
}

function project(projection: GeoProjection, places: readonly TravelPlace[]): MapPoint[] {
  return places.flatMap((place) => {
    const xy = projection([place.lng, place.lat]);
    return xy
      ? [{ id: place.id, x: Math.round(xy[0] * 10) / 10, y: Math.round(xy[1] * 10) / 10 }]
      : [];
  });
}

function worldView(places: readonly TravelPlace[]): MapView {
  const visited = new Set(places.map((place) => numericCode(place.country)));
  const countries = allCountries.filter((c) => c.id !== ANTARCTICA || visited.has(ANTARCTICA));
  const collection: FeatureCollection = { type: 'FeatureCollection', features: countries };
  const projection = geoEqualEarth().rotate([-10, 0]).fitWidth(MAP_WIDTH, collection);
  const path = geoPath(projection).digits(DIGITS);
  // Fit the width, then crop the height to the land actually drawn.
  const [[, y0], [, y1]] = path.bounds(collection);
  projection.translate([projection.translate()[0], projection.translate()[1] - y0 + 1]);

  return {
    key: 'world',
    label: 'World',
    height: Math.ceil(y1 - y0 + 2),
    sphere: path({ type: 'Sphere' }) ?? null,
    shapes: countries.map((country) => ({
      id: String(country.id),
      name: country.properties.name,
      d: path(country) ?? '',
      visited: visited.has(String(country.id)),
    })),
    points: project(projection, places),
  };
}

/** The US gets its states, with Alaska and Hawaii inset (Albers USA). */
function usView(places: readonly TravelPlace[]): MapView {
  const states = (feature(us, us.objects.states) as FeatureCollection<Geometry, { name: string }>)
    .features;
  const visited = new Set(places.map((place) => place.region));
  const height = 610;
  const projection = geoAlbersUsa().fitSize([MAP_WIDTH, height], {
    type: 'FeatureCollection',
    features: states,
  });
  const path = geoPath(projection).digits(DIGITS);

  return {
    key: 'US',
    label: countryName('US'),
    height,
    sphere: null,
    shapes: states.map((state) => ({
      id: String(state.id),
      name: state.properties.name,
      d: path(state) ?? '',
      visited: visited.has(state.properties.name),
    })),
    points: project(projection, places),
  };
}

/** The biggest polygon of a multi-part country. */
function mainland(shape: Feature<Geometry>): Feature {
  if (shape.geometry.type !== 'MultiPolygon') return shape;
  const parts = shape.geometry.coordinates.map((coordinates) => ({
    type: 'Polygon' as const,
    coordinates,
  }));
  const largest = parts.reduce((a, b) => (geoArea(b) > geoArea(a) ? b : a));
  return { type: 'Feature', properties: {}, geometry: largest };
}

/** Any other country: Mercator fitted to it (or to its pins), neighbours clipped at the frame. */
function countryView(code: string, places: readonly TravelPlace[]): MapView {
  const countries = countriesInDetail();
  const shape = countries.find((country) => country.id === numericCode(code));
  // Frame the country's largest landmass and every pin: Portugal's frame
  // should not stretch to the Azores unless a trip went there. A country too
  // small for the atlas (Singapore, Malta…) is framed by its pins alone.
  const pins: Feature[] = places.map((place) => ({
    type: 'Feature',
    properties: {},
    geometry: { type: 'Point', coordinates: [place.lng, place.lat] },
  }));
  const target: FeatureCollection = {
    type: 'FeatureCollection',
    features: shape ? [mainland(shape), ...pins] : pins,
  };
  const height = 610;
  const pad = shape ? 24 : 160;
  const projection = geoMercator()
    .fitExtent(
      [
        [pad, pad],
        [MAP_WIDTH - pad, height - pad],
      ],
      target,
    )
    .clipExtent([
      [0, 0],
      [MAP_WIDTH, height],
    ]);
  const path = geoPath(projection).digits(DIGITS);

  return {
    key: code,
    label: countryName(code),
    height,
    sphere: null,
    shapes: countries
      .map((country) => ({
        id: String(country.id),
        name: country.properties.name,
        d: path(country) ?? '',
        visited: country.id === numericCode(code),
      }))
      .filter((s) => s.d !== ''),
    points: project(projection, places),
  };
}

/**
 * Every filter on the page: each country with pins (the default first, then
 * by number of pins), then the whole world.
 */
export function buildMapViews(places: readonly TravelPlace[]): MapView[] {
  const byCountry = new Map<string, TravelPlace[]>();
  for (const place of places)
    byCountry.set(place.country, [...(byCountry.get(place.country) ?? []), place]);
  const order = Array.from(byCountry.keys()).sort(
    (a, b) =>
      Number(b === DEFAULT_COUNTRY) - Number(a === DEFAULT_COUNTRY) ||
      byCountry.get(b)!.length - byCountry.get(a)!.length ||
      countryName(a).localeCompare(countryName(b)),
  );
  return [
    ...order.map((code) =>
      code === 'US' ? usView(byCountry.get(code)!) : countryView(code, byCountry.get(code)!),
    ),
    worldView(places),
  ];
}
