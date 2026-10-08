'use client';

import { useRef, useState } from 'react';
import {
  groupPlaces,
  travelStats,
  type DiningSpot,
  type JournalTrip,
  type TravelPlace,
} from '@/lib/travel/model';
import type { MapView } from '@/lib/travelMap';

const MAP_WIDTH = 975;

/**
 * The map on /traveller: a country filter, the headline numbers for it, the
 * map, the same places as a list, and the trips from the travel journal.
 * Nothing on the page has a date: the content API removes them before the
 * build ever sees the journal (ai-content-orchestrator's travel_journal.py).
 *
 * The geometry arrives finished from the server (lib/travelMap.ts), so this
 * only filters and handles hover. Every pin's details are also in the list,
 * which is the keyboard and screen-reader way in: picking a place there
 * lights its pin and opens its card on the map.
 *
 * Themes: every colour is a --tv-* token from app/traveller/traveller.css,
 * which follows the live homepage design (prism, terracotta, or midnight in
 * light or dark), so nothing here names a colour. The exception is
 * forced-colors (Windows high contrast): the browser would
 * otherwise paint every state and every pin the same system colour, so the
 * map and its key opt out of that (forced-color-adjust: none) and use the
 * system colours themselves: Canvas land, Highlight for visited, CanvasText
 * pins.
 */
export function TravelMap({
  views,
  places,
  countryNames,
  trips,
  dining,
  defaultView,
}: {
  views: MapView[];
  places: readonly TravelPlace[];
  countryNames: Record<string, string>;
  trips: readonly JournalTrip[];
  dining: readonly DiningSpot[];
  defaultView: string;
}) {
  const [viewKey, setViewKey] = useState(
    views.some((view) => view.key === defaultView) ? defaultView : views[0].key,
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const mapRef = useRef<HTMLElement>(null);

  const view = views.find((v) => v.key === viewKey) ?? views[0];
  const isWorld = view.key === 'world';
  const nameOf = (code: string) => countryNames[code] ?? code;
  const inCountry = (place: TravelPlace) => isWorld || place.country === view.key;
  const shown = places.filter(inCountry);
  const tripsShown = trips.filter((trip) => isWorld || trip.countries.includes(view.key));
  const tripsByKey = new Map(trips.map((trip) => [trip.key, trip]));
  const diningByPin = new Map<string, number>();
  for (const spot of dining) {
    if (spot.pinId) diningByPin.set(spot.pinId, (diningByPin.get(spot.pinId) ?? 0) + 1);
  }
  const shownIds = new Set(shown.map((place) => place.id));
  const stats = travelStats(shown, tripsShown);
  const byId = new Map(places.map((place) => [place.id, place]));
  const active = activeId && shownIds.has(activeId) ? byId.get(activeId) : undefined;
  const activePoint = active ? view.points.find((point) => point.id === active.id) : undefined;
  const regionLabel = view.key === 'US' ? 'states' : 'regions';

  function selectView(key: string) {
    setViewKey(key);
    setActiveId(null);
  }

  // From a trip card or a café: light the pin and bring the map into view,
  // switching to a view that has the pin if this one does not.
  function showPin(id: string) {
    const pin = byId.get(id);
    if (pin && !view.points.some((point) => point.id === id)) {
      setViewKey(views.some((v) => v.key === pin.country) ? pin.country : 'world');
    }
    setActiveId(id);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    mapRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }

  const statTiles = [
    { label: 'places', value: stats.places },
    { label: regionLabel, value: stats.regions },
    { label: stats.countries === 1 ? 'country' : 'countries', value: stats.countries },
    ...(trips.length ? [{ label: stats.trips === 1 ? 'trip' : 'trips', value: stats.trips }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Show places in" className="flex flex-wrap gap-2">
          {views.map((option) => {
            const selected = option.key === view.key;
            const count = places.filter(
              (place) => option.key === 'world' || place.country === option.key,
            ).length;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => selectView(option.key)}
                aria-pressed={selected}
                className={`focus-ring inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  selected
                    ? 'border-[var(--tv-chip-on-bg)] bg-[var(--tv-chip-on-bg)] text-[var(--tv-chip-on-ink)] forced-colors:border-[Highlight]'
                    : 'border-[var(--tv-chip-border)] bg-[var(--tv-chip-bg)] text-[var(--tv-muted)] hover:border-[var(--tv-ink)]'
                }`}
              >
                {selected && (
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4">
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {option.label}
                <span
                  className={`font-[family-name:var(--tv-label)] text-xs ${selected ? 'opacity-70' : 'text-[var(--tv-faint)]'}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <dl
        className={`grid gap-3 ${statTiles.length === 4 ? 'grid-cols-2 sm:max-w-2xl sm:grid-cols-4' : 'grid-cols-3 sm:max-w-lg'}`}
      >
        {statTiles.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[var(--tv-border)] bg-[var(--tv-surface)] px-4 py-3"
          >
            <dt className="font-[family-name:var(--tv-label)] text-[11px] uppercase tracking-[0.18em] text-[var(--tv-faint)]">
              {stat.label}
            </dt>
            <dd className="mt-1 tv-title text-3xl tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <figure
        ref={mapRef}
        className="overflow-hidden rounded-3xl border border-[var(--tv-border)] bg-[var(--tv-surface)] p-3 sm:p-6"
      >
        <div
          className="relative forced-colors:[forced-color-adjust:none]"
          onPointerLeave={() => setActiveId(null)}
        >
          <svg
            viewBox={`0 0 ${MAP_WIDTH} ${view.height}`}
            role="img"
            aria-label={`Map of ${isWorld ? 'the world' : view.label} with ${stats.places} places pinned. They are listed below the map.`}
            className="block h-auto w-full"
          >
            {view.sphere && (
              <path
                d={view.sphere}
                className="fill-[var(--tv-sea)] forced-colors:fill-[Canvas] forced-colors:stroke-[CanvasText]"
              />
            )}
            <g>
              {view.shapes.map((shape) => (
                <path
                  key={shape.id}
                  d={shape.d}
                  className={
                    shape.visited
                      ? 'fill-[var(--tv-visited)] stroke-[var(--tv-edge)] forced-colors:fill-[Highlight] forced-colors:stroke-[Canvas]'
                      : 'fill-[var(--tv-land)] stroke-[var(--tv-edge)] forced-colors:fill-[Canvas] forced-colors:stroke-[CanvasText]'
                  }
                  strokeWidth={isWorld ? 0.5 : 1}
                >
                  <title>{shape.name}</title>
                </path>
              ))}
            </g>
          </svg>

          {/* Pins are HTML over the map rather than SVG circles, so they stay
              the same size on a phone, where the map is drawn at a third of
              its width, and each keeps a 24px hit area however small the map. */}
          {view.points
            .filter((point) => shownIds.has(point.id))
            .map((point) => {
              const isActive = point.id === active?.id;
              return (
                <span
                  key={point.id}
                  aria-hidden="true"
                  onPointerEnter={() => setActiveId(point.id)}
                  onClick={() => setActiveId(point.id)}
                  className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center"
                  style={{
                    left: `${(point.x / MAP_WIDTH) * 100}%`,
                    top: `${(point.y / view.height) * 100}%`,
                  }}
                >
                  <span
                    className={`block rounded-full border-2 border-[var(--tv-pin-ring)] bg-[var(--tv-pin)] transition-all forced-colors:border-[Canvas] forced-colors:bg-[CanvasText] ${
                      isActive ? 'h-4 w-4' : isWorld ? 'h-2.5 w-2.5' : 'h-3 w-3'
                    }`}
                  />
                </span>
              );
            })}

          {active && activePoint && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute z-10 w-max max-w-[16rem] rounded-xl border border-[var(--tv-border)] bg-[var(--tv-tip-bg)] px-3 py-2 text-sm text-[var(--tv-ink)] shadow-lg forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]"
              style={{
                left: `${(activePoint.x / MAP_WIDTH) * 100}%`,
                top: `${(activePoint.y / view.height) * 100}%`,
                transform: `translate(${activePoint.x / MAP_WIDTH > 0.65 ? 'calc(-100% - 14px)' : '14px'}, ${
                  activePoint.y / view.height > 0.7 ? 'calc(-100% + 8px)' : '-8px'
                })`,
              }}
            >
              <p className="font-semibold">{active.name}</p>
              <p className="text-[var(--tv-muted)] forced-colors:text-[CanvasText]">
                {[
                  active.region !== active.name ? active.region : null,
                  isWorld || active.country !== view.key ? nameOf(active.country) : null,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              {active.tripKeys.slice(0, 3).map((key) => (
                <p
                  key={key}
                  className="text-xs text-[var(--tv-muted)] forced-colors:text-[CanvasText]"
                >
                  {tripsByKey.get(key)?.title}
                </p>
              ))}
              {active.tripKeys.length > 3 && (
                <p className="text-xs text-[var(--tv-faint)]">
                  and {active.tripKeys.length - 3} more trips
                </p>
              )}
              {diningByPin.has(active.id) && (
                <p className="mt-1 text-xs text-[var(--tv-faint)]">
                  {diningByPin.get(active.id)} cafés & restaurants
                </p>
              )}
            </div>
          )}
        </div>

        <figcaption className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--tv-muted)]">
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-full bg-[var(--tv-pin)] forced-colors:bg-[CanvasText] forced-colors:[forced-color-adjust:none]"
            />
            A place I have been
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-3 w-4 rounded-sm bg-[var(--tv-visited)] forced-colors:bg-[Highlight] forced-colors:[forced-color-adjust:none]"
            />
            {isWorld
              ? 'A country with a pin'
              : view.key === 'US'
                ? 'A state with a pin'
                : view.label}
          </span>
          <span className="text-[var(--tv-faint)]">
            Pinned from where my photos were taken, to the nearest city or park.
          </span>
        </figcaption>
      </figure>

      <section aria-labelledby="traveller-places">
        <h2 id="traveller-places" className="tv-title text-2xl tracking-tight sm:text-3xl">
          Every place on the map
        </h2>
        <div className="mt-4 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {groupPlaces(shown, nameOf).map(({ group, places: items }) => (
            <div key={group}>
              <h3 className="font-[family-name:var(--tv-label)] text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--tv-faint)]">
                {group} <span className="font-normal">· {items.length}</span>
              </h3>
              <ul className="mt-2 space-y-0.5">
                {items.map((place) => (
                  <li key={place.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(place.id)}
                      onFocus={() => setActiveId(place.id)}
                      onPointerEnter={() => setActiveId(place.id)}
                      aria-pressed={active?.id === place.id}
                      className={`focus-ring -mx-2 flex w-full items-baseline justify-between gap-3 rounded-lg px-2 py-1 text-left text-sm transition ${
                        active?.id === place.id
                          ? 'bg-[var(--tv-row-active)] forced-colors:outline forced-colors:outline-1'
                          : 'hover:bg-[var(--tv-row-hover)]'
                      }`}
                    >
                      <span className="text-[var(--tv-ink)]">
                        {place.name}
                        {place.tripKeys.length > 0 && (
                          <span className="sr-only">
                            , {place.tripKeys.map((key) => tripsByKey.get(key)?.title).join('; ')}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs text-[var(--tv-faint)]">
                        {place.region}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {tripsShown.length > 0 && (
        <section aria-labelledby="traveller-trips">
          <h2 id="traveller-trips" className="tv-title text-2xl tracking-tight sm:text-3xl">
            Trips
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--tv-muted)]">
            From my travel journal. Open one for the story, and the photos I shared from it.
          </p>
          <ul className="mt-5 grid gap-3 md:grid-cols-2">
            {tripsShown.map((trip) => (
              <li key={trip.key}>
                <TripCard
                  trip={trip}
                  pins={trip.placeIds.flatMap((id) =>
                    shownIds.has(id) ? (byId.get(id) ?? []) : [],
                  )}
                  onShowPin={showPin}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {dining.length > 0 && <DiningSection dining={dining} pinsById={byId} onShowPin={showPin} />}
    </div>
  );
}

const DINING_GROUPS = [
  { category: 'cafe', label: 'Cafés' },
  { category: 'restaurant', label: 'Restaurants' },
  { category: 'other dining', label: 'Bakeries & treats' },
] as const;

/**
 * Where I eat and drink coffee, from the content API's curated list: no fast
 * food, no visit counts, and only names a visitor could look up. A place
 * whose city is on the map links to its pin; the card export left most
 * without a city, so those are simply listed.
 */
function DiningSection({
  dining,
  pinsById,
  onShowPin,
}: {
  dining: readonly DiningSpot[];
  pinsById: Map<string, TravelPlace>;
  onShowPin: (id: string) => void;
}) {
  // Best first, then by name: his ratings, not how often he went.
  const reviewed = dining
    .filter((spot) => spot.review)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.name.localeCompare(b.name));
  return (
    <section aria-labelledby="traveller-dining">
      <h2 id="traveller-dining" className="tv-title text-2xl tracking-tight sm:text-3xl">
        Cafés & restaurants
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-[var(--tv-muted)]">
        Places I have sat down in lately. Fast food left out. Pick one with a place to see it on the
        map.
      </p>

      {reviewed.length > 0 && (
        <>
          <h3 className="mt-6 font-[family-name:var(--tv-label)] text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--tv-faint)]">
            My reviews <span className="font-normal">· {reviewed.length}</span>
          </h3>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {reviewed.map((spot) => (
              <li key={`${spot.name}-${spot.city ?? ''}`}>
                <ReviewCard
                  spot={spot}
                  pin={spot.pinId ? pinsById.get(spot.pinId) : undefined}
                  onShowPin={onShowPin}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-8 grid gap-x-8 gap-y-6 md:grid-cols-3">
        {DINING_GROUPS.map(({ category, label }) => {
          const spots = dining
            .filter((spot) => spot.category === category && !spot.review)
            .sort((a, b) => a.name.localeCompare(b.name));
          if (spots.length === 0) return null;
          return (
            <div key={category}>
              <h3 className="font-[family-name:var(--tv-label)] text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--tv-faint)]">
                {label} <span className="font-normal">· {spots.length}</span>
              </h3>
              <ul className="mt-2 space-y-0.5 text-sm">
                {spots.map((spot) => {
                  const pin = spot.pinId ? pinsById.get(spot.pinId) : undefined;
                  const where = spot.city ?? pin?.name;
                  const content = (
                    <>
                      <span className="text-[var(--tv-ink)]">{spot.name}</span>
                      {where && (
                        <span className="shrink-0 text-xs text-[var(--tv-faint)]">{where}</span>
                      )}
                    </>
                  );
                  return (
                    <li key={`${spot.name}-${spot.city ?? ''}`}>
                      {pin ? (
                        <button
                          type="button"
                          onClick={() => onShowPin(pin.id)}
                          className="focus-ring -mx-2 flex w-full items-baseline justify-between gap-3 rounded-lg px-2 py-1 text-left transition hover:bg-[var(--tv-row-hover)]"
                        >
                          {content}
                          <span className="sr-only">, show {pin.name} on the map</span>
                        </button>
                      ) : (
                        <span className="-mx-2 flex items-baseline justify-between gap-3 px-2 py-1">
                          {content}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Filled and empty stars, with the number for anyone not reading the glyphs. */
function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="shrink-0 whitespace-nowrap text-sm"
      aria-label={`${rating} out of 5 stars`}
      role="img"
    >
      <span aria-hidden="true" className="text-[var(--tv-pin)] forced-colors:text-[CanvasText]">
        {'★'.repeat(rating)}
      </span>
      <span
        aria-hidden="true"
        className="text-[var(--tv-chip-border)] forced-colors:text-[GrayText]"
      >
        {'★'.repeat(5 - rating)}
      </span>
    </span>
  );
}

/** A reviewed café or restaurant: name and stars, open for the review. */
function ReviewCard({
  spot,
  pin,
  onShowPin,
}: {
  spot: DiningSpot;
  pin: TravelPlace | undefined;
  onShowPin: (id: string) => void;
}) {
  const where = spot.city ?? pin?.name;
  return (
    <details className="group rounded-2xl border border-[var(--tv-border)] bg-[var(--tv-surface)] px-5 py-4">
      <summary className="focus-ring flex cursor-pointer list-none items-start justify-between gap-4 rounded-lg [&::-webkit-details-marker]:hidden">
        <span>
          <span className="tv-title block text-lg leading-snug">{spot.name}</span>
          {where && <span className="mt-0.5 block text-xs text-[var(--tv-faint)]">{where}</span>}
        </span>
        <span className="flex items-center gap-3">
          {spot.rating && <Stars rating={spot.rating} />}
          <span
            aria-hidden="true"
            className="text-lg leading-none text-[var(--tv-faint)] transition group-open:rotate-45"
          >
            +
          </span>
        </span>
      </summary>
      <p className="mt-3 leading-relaxed text-[var(--tv-ink)]">{spot.review}</p>
      {pin && (
        <button
          type="button"
          onClick={() => onShowPin(pin.id)}
          className="focus-ring mt-3 rounded-full border border-[var(--tv-chip-border)] px-3 py-1 text-sm text-[var(--tv-ink)] hover:border-[var(--tv-ink)]"
        >
          Show {pin.name} on the map
        </button>
      )}
    </details>
  );
}

/** One trip, closed to its title and places; open for the story and the photo links. */
function TripCard({
  trip,
  pins,
  onShowPin,
}: {
  trip: JournalTrip;
  pins: TravelPlace[];
  onShowPin: (id: string) => void;
}) {
  return (
    <details className="group rounded-2xl border border-[var(--tv-border)] bg-[var(--tv-surface)] px-5 py-4 open:pb-5">
      <summary className="focus-ring flex cursor-pointer list-none items-start justify-between gap-4 rounded-lg [&::-webkit-details-marker]:hidden">
        <span>
          <span className="tv-title block text-xl leading-snug">{trip.title}</span>
          {pins.length > 0 && (
            <span className="mt-1 block text-sm text-[var(--tv-muted)]">
              {pins.map((pin) => pin.name).join(' · ')}
            </span>
          )}
        </span>
        <span
          aria-hidden="true"
          className="mt-1 shrink-0 text-lg leading-none text-[var(--tv-faint)] transition group-open:rotate-45"
        >
          +
        </span>
      </summary>

      {trip.summary && <p className="mt-3 leading-relaxed text-[var(--tv-ink)]">{trip.summary}</p>}

      {trip.highlights.length > 0 && (
        <ul aria-label="Highlights" className="mt-3 flex flex-wrap gap-2">
          {trip.highlights.map((highlight) => (
            <li
              key={highlight}
              className="tv-label rounded-full border border-[var(--tv-chip-border)] px-3 py-1 text-[11px] text-[var(--tv-muted)]"
            >
              {highlight}
            </li>
          ))}
        </ul>
      )}

      {pins.length > 0 && (
        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[var(--tv-muted)]">
          <span>On the map:</span>
          {pins.map((pin) => (
            <button
              key={pin.id}
              type="button"
              onClick={() => onShowPin(pin.id)}
              className="focus-ring rounded-full border border-[var(--tv-chip-border)] px-3 py-1 text-[var(--tv-ink)] hover:border-[var(--tv-ink)]"
            >
              {pin.name}
            </button>
          ))}
        </p>
      )}

      {trip.posts.length > 0 && (
        <div className="mt-4">
          <p className="tv-label text-[11px] uppercase tracking-[0.18em] text-[var(--tv-faint)]">
            On Instagram
          </p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {trip.posts.map((post) => (
              <li key={post.url}>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring rounded-sm text-[var(--tv-ink)] underline decoration-[var(--tv-chip-border)] underline-offset-4 hover:decoration-[var(--tv-ink)]"
                >
                  {post.description}
                  <span className="sr-only"> (Instagram, opens in a new tab)</span>
                  <span aria-hidden="true"> ↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </details>
  );
}
