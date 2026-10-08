/**
 * The four stops on the prism landing's walk, timed against the loop in
 * public/prism/walk-*.{webm,mp4} (8.0s; it dips to dark for 0.35s at each
 * end, which is what makes the loop seamless). Times were read off the clip
 * frame by frame: he is at the desk until ~1.4s, passes the camera on its
 * tripod until ~2.9s, the bookshelf (reaching for a book at ~4.6s) until
 * ~5.0s, then sits down in the café. Re-time these if the video changes.
 */
export const PRISM_LOOP_SECONDS = 8;

export interface PrismStation {
  key: 'architect' | 'photographer' | 'researcher' | 'traveller';
  label: string;
  /** What he is doing at this stop, for people who cannot see the video. */
  scene: string;
  blurb: string;
  /** Where "explore" goes; null means it is not built yet. */
  href: string | null;
  hrefLabel: string;
  /** Seconds into the loop this stop starts and ends. */
  start: number;
  end: number;
  /** Where to jump when someone picks this stop: just after it starts, past the dip. */
  seekTo: number;
}

export const PRISM_STATIONS: readonly PrismStation[] = [
  {
    key: 'architect',
    label: 'Software Architect',
    scene: 'At his standing desk, coding on two monitors',
    blurb: 'A decade designing payment platforms at JP Morgan Chase: cloud-native, fault-tolerant, shipped by teams he leads.',
    href: '#prism-about',
    hrefLabel: 'See the work',
    start: 0,
    end: 1.4,
    seekTo: 0.4,
  },
  {
    key: 'photographer',
    label: 'Photographer',
    scene: 'Walking past his camera on its tripod',
    blurb: 'Streets, light and the people in between.',
    href: null,
    hrefLabel: 'Gallery coming soon',
    start: 1.4,
    end: 2.9,
    seekTo: 1.45,
  },
  {
    key: 'researcher',
    label: 'AI Researcher',
    scene: 'Reaching for a book on the shelf',
    blurb: 'Preprints on how AI systems behave in production, published on Zenodo.',
    href: '/publications',
    hrefLabel: 'Read the preprints',
    start: 2.9,
    end: 5.0,
    seekTo: 2.95,
  },
  {
    key: 'traveller',
    label: 'Traveller',
    scene: 'Sitting down in the café with a coffee',
    blurb: 'Cafés, cities and long walks somewhere new.',
    href: '/traveller',
    hrefLabel: "See where I've been",
    start: 5.0,
    end: PRISM_LOOP_SECONDS,
    seekTo: 5.05,
  },
];

/** Which stop the video is at. Any time is folded into one loop first. */
export function stationIndexAt(seconds: number): number {
  if (!Number.isFinite(seconds)) return 0;
  const t = ((seconds % PRISM_LOOP_SECONDS) + PRISM_LOOP_SECONDS) % PRISM_LOOP_SECONDS;
  const index = PRISM_STATIONS.findIndex((station) => t >= station.start && t < station.end);
  return index === -1 ? PRISM_STATIONS.length - 1 : index;
}

/** How far through its stop the video is, 0 to 1 (drives the progress line). */
export function stationProgressAt(seconds: number): number {
  const station = PRISM_STATIONS[stationIndexAt(seconds)];
  const t = ((seconds % PRISM_LOOP_SECONDS) + PRISM_LOOP_SECONDS) % PRISM_LOOP_SECONDS;
  return Math.min(1, Math.max(0, (t - station.start) / (station.end - station.start)));
}
