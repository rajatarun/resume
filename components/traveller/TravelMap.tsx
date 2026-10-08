'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildStory,
  joinNames,
  travelStats,
  type DiningSpot,
  type JournalTrip,
  type StoryChapter,
  type TravelPlace,
} from '@/lib/travel/model';
import type { MapView } from '@/lib/travelMap';

const MAP_WIDTH = 975;

/**
 * /traveller as a story: a country filter, the headline numbers, then the map
 * beside a chapter for each place (buildStory in lib/travel/model.ts): the
 * trips that went there, what stayed with me, photos, and my reviews of where
 * I ate. On a wide screen the map stays put while the chapters scroll, and the
 * chapter in the middle of the screen lights its pin; clicking a pin scrolls
 * to its chapter. Nothing has a date: the content API removes them before the
 * build ever sees the journal (ai-content-orchestrator's travel_journal.py).
 *
 * The geometry arrives finished from the server (lib/travelMap.ts). The
 * chapters are the keyboard and screen-reader way in; the map repeats them.
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
  const story = useMemo(
    () => buildStory(places, trips, dining, (code) => countryNames[code] ?? code),
    [places, trips, dining, countryNames],
  );
  const chaptersShown = story.chapters.filter((chapter) => isWorld || chapter.country === view.key);
  const showDiningChapters = isWorld || view.key === 'US';
  const storyRef = useRef<HTMLDivElement>(null);

  // The chapter crossing the middle of the screen lights its pin.
  useEffect(() => {
    const root = storyRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const pinId = (entry.target as HTMLElement).dataset.pin;
          setActiveId(pinId || null);
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    root.querySelectorAll('article[data-pin]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [viewKey]);

  // From the map: go to the pin's chapter.
  function goToChapter(pinId: string) {
    setActiveId(pinId);
    const chapterId = story.chapterOfPin[pinId];
    if (!chapterId) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document
      .getElementById(chapterId)
      ?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  function selectView(key: string) {
    setViewKey(key);
    setActiveId(null);
  }

  // From a chapter: light the pin and bring the map into view, switching to
  // a view that has the pin if this one does not.
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

      <div className="lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12">
        <div className="lg:sticky lg:top-24 lg:self-start">
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
                aria-label={`Map of ${isWorld ? 'the world' : view.label} with ${stats.places} places pinned. Each place's story follows.`}
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
                      onClick={() => goToChapter(point.id)}
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
                Pinned from where my photos were taken. Pick a pin to read its story.
              </span>
            </figcaption>
          </figure>
        </div>

        <div ref={storyRef} className="mt-12 space-y-20 lg:mt-0">
          {chaptersShown.map((chapter, index) => (
            <Chapter
              key={chapter.id}
              number={index + 1}
              chapter={chapter}
              pinsById={byId}
              onShowPin={showPin}
            />
          ))}

          {showDiningChapters && story.cafes.length > 0 && (
            <ReviewChapter
              id="story-coffee"
              kicker="Wherever I am"
              title="Coffee, wherever I am"
              intro="The cafés and bakeries I keep going back to, in my own words."
              plainIntro="And the others I have stopped at:"
              spots={story.cafes}
            />
          )}
          {showDiningChapters && story.tables.length > 0 && (
            <ReviewChapter
              id="story-tables"
              kicker="Wherever I am"
              title="Tables I come back to"
              intro="And the restaurants, for when coffee turns into a meal."
              plainIntro="I have also eaten at"
              spots={story.tables}
            />
          )}

          {story.passedThrough
            .filter((group) => isWorld || group.country === view.key)
            .map((group) => (
              <article key={group.country} className="scroll-mt-28">
                <p className="tv-label text-[11px] uppercase tracking-[0.25em] text-[var(--tv-faint)]">
                  Still to be written
                </p>
                <h3 className="tv-title mt-2 text-3xl leading-tight sm:text-4xl">
                  Also on the map
                </h3>
                <p className="mt-4 text-[17px] leading-relaxed text-[var(--tv-ink)]">
                  In {group.country === 'US' ? 'the ' : ''}
                  {nameOf(group.country)} I have also been to{' '}
                  {group.pinIds.map((pinId, i) => (
                    <span key={pinId}>
                      {i > 0 && (i === group.pinIds.length - 1 ? ' and ' : ', ')}
                      <button
                        type="button"
                        onClick={() => showPin(pinId)}
                        className="focus-ring rounded-sm underline decoration-[var(--tv-chip-border)] underline-offset-4 hover:decoration-[var(--tv-ink)]"
                      >
                        {byId.get(pinId)?.name}
                      </button>
                    </span>
                  ))}
                  . Their stories are still to come.
                </p>
              </article>
            ))}
        </div>
      </div>
    </div>
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

/** One place: its trips told as prose, what stayed with me, photos, and reviews. */
function Chapter({
  number,
  chapter,
  pinsById,
  onShowPin,
}: {
  number: number;
  chapter: StoryChapter;
  pinsById: Map<string, TravelPlace>;
  onShowPin: (id: string) => void;
}) {
  const nameOf = (id: string) => pinsById.get(id)?.name ?? '';
  return (
    <article id={chapter.id} data-pin={chapter.pinId ?? ''} className="scroll-mt-28">
      <p className="tv-label text-[11px] uppercase tracking-[0.25em] text-[var(--tv-faint)]">
        {String(number).padStart(2, '0')} · {chapter.where}
      </p>
      <h3 className="tv-title mt-2 text-3xl leading-tight sm:text-4xl">{chapter.title}</h3>
      {chapter.withPins.length > 0 && (
        <p className="mt-1 text-sm text-[var(--tv-muted)]">
          and on to {joinNames(chapter.withPins.map(nameOf))}
        </p>
      )}

      {chapter.trips.map((trip) => (
        <TripStory key={trip.key} trip={trip} />
      ))}

      {chapter.alsoIn.map(({ trip, chapterId }) => (
        <p key={trip.key} className="mt-4 text-[var(--tv-muted)]">
          I came back on <em>{trip.title}</em>; that story is{' '}
          <a
            href={`#${chapterId}`}
            className="focus-ring rounded-sm underline decoration-[var(--tv-chip-border)] underline-offset-4 hover:decoration-[var(--tv-ink)]"
          >
            told under {nameOf(chapterId.replace(/^story-/, ''))}
          </a>
          .
        </p>
      ))}

      {chapter.reviews.map((spot) => (
        <Review key={spot.name} spot={spot} />
      ))}

      {chapter.stops.some((spot) => spot.note) && (
        <div className="mt-6">
          <p className="tv-label text-[11px] uppercase tracking-[0.2em] text-[var(--tv-faint)]">
            Where I ate
          </p>
          {chapter.stops
            .filter((spot) => spot.note)
            .map((spot) => (
              <Noted key={spot.name} spot={spot} />
            ))}
        </div>
      )}
      {chapter.stops.some((spot) => !spot.note) && (
        <p className="mt-4 text-[var(--tv-muted)]">
          I also ate at{' '}
          {joinNames(chapter.stops.filter((spot) => !spot.note).map((spot) => spot.name))}.
        </p>
      )}

      {chapter.pinId && (
        <button
          type="button"
          onClick={() => onShowPin(chapter.pinId!)}
          className="focus-ring mt-5 rounded-full border border-[var(--tv-chip-border)] px-3 py-1 text-sm text-[var(--tv-ink)] hover:border-[var(--tv-ink)] lg:hidden"
        >
          Show on the map
        </button>
      )}
    </article>
  );
}

/** One trip at a place: its title leads into the story, then what stayed with me and the photos. */
function TripStory({ trip }: { trip: JournalTrip }) {
  return (
    <div className="mt-5">
      <p className="text-[17px] leading-relaxed text-[var(--tv-ink)]">
        <span className="tv-title text-xl">{trip.title}.</span>{' '}
        {trip.summary ?? 'A trip I have yet to write up.'}
      </p>
      {trip.highlights.length > 0 && (
        <p className="tv-label mt-3 text-[11px] uppercase leading-relaxed tracking-[0.15em] text-[var(--tv-faint)]">
          What stayed with me: {trip.highlights.join(' · ')}
        </p>
      )}
      {trip.posts.length > 0 && (
        <p className="mt-3 text-sm leading-relaxed text-[var(--tv-muted)]">
          Photos from it:{' '}
          {trip.posts.slice(0, 3).map((post, i) => (
            <span key={post.url}>
              {i > 0 && ' · '}
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring rounded-sm italic text-[var(--tv-ink)] underline decoration-[var(--tv-chip-border)] underline-offset-4 hover:decoration-[var(--tv-ink)]"
              >
                {post.description.replace(/\.$/, '')}
                <span className="sr-only"> (Instagram, opens in a new tab)</span>
              </a>
            </span>
          ))}
          {trip.posts.length > 3 && ` and ${trip.posts.length - 3} more on Instagram`}.
        </p>
      )}
    </div>
  );
}

/** A review, set like a quotation: the place and my stars, then my words. */
function Review({ spot }: { spot: DiningSpot }) {
  return (
    <blockquote className="mt-6 border-l-2 border-[var(--tv-pin)] pl-4 forced-colors:border-[CanvasText]">
      <p className="flex flex-wrap items-baseline gap-x-3">
        <span className="tv-title text-lg">{spot.name}</span>
        {spot.rating && <Stars rating={spot.rating} />}
      </p>
      <p className="mt-1 leading-relaxed text-[var(--tv-ink)]">{spot.review}</p>
    </blockquote>
  );
}

/**
 * A described place: its name, a public score (plain text, never stars: it is
 * not my rating) and one line on what it is.
 */
function Noted({ spot }: { spot: DiningSpot }) {
  return (
    <p className="mt-3 leading-relaxed text-[var(--tv-ink)]">
      <span className="tv-title text-lg">{spot.name}</span>
      {spot.score && (
        <span className="ml-2 text-xs text-[var(--tv-faint)]">
          {spot.score.toFixed(1)}/5<span className="sr-only"> public score</span>
        </span>
      )}
      {spot.note && <span className="text-[var(--tv-muted)]"> — {spot.note}</span>}
    </p>
  );
}

/** The places no pin on the map claims, as a chapter of their own. */
function ReviewChapter({
  id,
  kicker,
  title,
  intro,
  plainIntro,
  spots,
}: {
  id: string;
  kicker: string;
  title: string;
  intro: string;
  /** Leads into the list of places with no words of their own yet. */
  plainIntro: string;
  spots: DiningSpot[];
}) {
  return (
    <article id={id} data-pin="" className="scroll-mt-28">
      <p className="tv-label text-[11px] uppercase tracking-[0.25em] text-[var(--tv-faint)]">
        {kicker}
      </p>
      <h3 className="tv-title mt-2 text-3xl leading-tight sm:text-4xl">{title}</h3>
      <p className="mt-4 text-[17px] leading-relaxed text-[var(--tv-muted)]">{intro}</p>
      {spots
        .filter((spot) => spot.review)
        .map((spot) => (
          <Review key={spot.name} spot={spot} />
        ))}
      {spots.some((spot) => !spot.review && spot.note) && (
        <div className="mt-8">
          <p className="tv-label text-[11px] uppercase tracking-[0.2em] text-[var(--tv-faint)]">
            More worth a stop
          </p>
          {spots
            .filter((spot) => !spot.review && spot.note)
            .map((spot) => (
              <Noted key={spot.name} spot={spot} />
            ))}
        </div>
      )}
      {spots.some((spot) => !spot.review && !spot.note) && (
        <p className="mt-6 leading-relaxed text-[var(--tv-muted)]">
          {plainIntro}{' '}
          {joinNames(spots.filter((spot) => !spot.review && !spot.note).map((spot) => spot.name))}.
        </p>
      )}
    </article>
  );
}
