/**
 * Living postcards: short clips animated (with Veo, in Google Flow) from
 * Tarun's own photos, one at the top of a featured /traveller chapter.
 *
 * The files are in public/travel-clips/<pinId>.{mp4,webp}: cropped to the
 * photo, looped by blending the last second into the first, with no sound and
 * no file metadata. A chapter whose pin has no entry here shows no clip.
 */
export interface Postcard {
  /** The chapter's pin, which is also the file name. */
  pinId: string;
  /** What the caption calls it, when that is not just the chapter's place. */
  label: string;
  /** What the clip shows, for people who cannot see it. */
  alt: string;
  width: number;
  height: number;
}

export const POSTCARDS: readonly Postcard[] = [
  {
    pinId: 'us-fairbanks',
    label: 'Fairbanks',
    alt: 'The aurora ripples green and pink over a snowy cabin.',
    width: 960,
    height: 532,
  },
  {
    pinId: 'us-big-sur',
    label: 'Bixby Bridge, Big Sur',
    alt: 'Waves break on the rocks below Bixby Bridge.',
    width: 960,
    height: 538,
  },
  {
    pinId: 'us-death-valley',
    label: "Devil's Golf Course, Death Valley",
    alt: 'Light shifts across jagged salt formations below the mountains.',
    width: 878,
    height: 712,
  },
  {
    pinId: 'us-san-antonio',
    label: 'On the train to San Antonio',
    alt: 'Green fields slide past a train window at sunset.',
    width: 952,
    height: 712,
  },
  {
    pinId: 'us-chicago',
    label: 'Chicago',
    alt: 'An elevated train rolls across a red steel bridge downtown.',
    width: 952,
    height: 712,
  },
  {
    pinId: 'us-great-smoky-mountains',
    label: 'Great Smoky Mountains',
    alt: 'A waterfall pours over mossy rocks in a green forest.',
    width: 960,
    height: 636,
  },
  {
    pinId: 'us-niagara-falls',
    label: 'Niagara Falls',
    alt: 'The falls pour over the cliff as mist rises from the gorge.',
    width: 960,
    height: 636,
  },
  {
    pinId: 'us-new-york-city',
    label: 'The Statue of Liberty, New York',
    alt: 'The Statue of Liberty and the Lower Manhattan skyline across the harbor.',
    width: 960,
    height: 636,
  },
  {
    pinId: 'us-boston',
    label: 'Jordan Pond, Acadia',
    alt: 'Snow-dusted mountains above a rocky shore and a pond.',
    width: 952,
    height: 712,
  },
  {
    pinId: 'us-myrtle-beach',
    label: 'Myrtle Beach',
    alt: 'Waves roll in under a colorful sunrise sky by the beachfront.',
    width: 952,
    height: 712,
  },
  {
    pinId: 'in-bengaluru',
    label: 'Flying home to India',
    alt: 'Mountain ranges drift past beneath an airplane wing.',
    width: 712,
    height: 712,
  },
];

export const POSTCARD_BY_PIN: ReadonlyMap<string, Postcard> = new Map(
  POSTCARDS.map((card) => [card.pinId, card]),
);

export const postcardSrc = (card: Postcard, ext: 'mp4' | 'webp') =>
  `/travel-clips/${card.pinId}.${ext}`;
