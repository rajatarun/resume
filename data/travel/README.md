# Traveller data

`/traveller` is built from two sources, both read at build time:

| Source                                                                                            | What it is                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `places.json` (this folder)                                                                       | Places with no trip attached: read off the Google Photos heat map, plus landmarks named from the journal (Mount Hood, Fairbanks…). Edit freely; a mistake fails the build, naming the field.                          |
| The content API ([ai-content-orchestrator](https://github.com/rajatarun/ai-content-orchestrator)) | The **travel journal** and the **cafés & restaurants**, uploaded from Admin → Settings → Travel data. Fetched from `GET /site/travel` by `scripts/sync-travel.mjs` into `generated/` (gitignored) before every build. |

Nothing personal is committed here: the journal and the card export live in
the content API, and what the site gets from it has been cut down there.

## What the public page gets

- **Trips, without dates.** No start/end dates, photo timestamps, trip ids
  (Ask Photos writes them as dates), years or month names in the text, and
  not in date order. The full journal, dates included, is only in the admin
  panel.
- **Cafés & restaurants, without visit counts.** Fast food (labelled, or a
  known chain), delivery apps, card offers, workplace cafeterias, generic
  names and unreadable card codes are left out, and two spellings of one place
  merged. The admin panel lists everything left out and why.
- **Instagram links** to the photos in the journal, post and reel URLs only.
  Instagram shows each post's own date; that is Instagram's page, not this one.

## How it reads

The page is a story, not a list: one chapter per place, west to east, then
other countries. A trip is told at the first place it pinned; its other places
point back to it. A review sits in the chapter of the place its city or its own
words name ("a stylish LA atmosphere" goes to Los Angeles; `PLACE_WORDS` in
`lib/travel/model.ts`); the rest close the page as two chapters, cafés and
restaurants. Notes (a place's one-line description and public score, with the
city from its address) put a place in its city's chapter under "Where I ate"; the
score shows as plain text, never as stars, since it is not Tarun's rating. Places with no story yet end it in a sentence.

## How it lands on the map

- A trip's place within 30 km of a pin in the same country _is_ that pin
  ("San Francisco" lands on "San Francisco Bay Area", an unnamed point
  beside a national park on that park; a pin with `radiusKm` reaches further,
  so every Alaska trip lands on Fairbanks). A place with no city takes its region's name;
  with neither, or with no coordinates, it is not pinned (its trip is still
  listed) and the build logs `[traveller] skipped …`.
- A café sits on the pin for its city; suburbs go to their metro's pin
  (Plano → Dallas–Fort Worth, Glendale → Los Angeles; `METRO_TOWNS` in
  `lib/travel/model.ts`). Most card entries have no city, so most are listed
  without a pin.
- A new country gets its own map filter automatically.

## Updating

Upload in the admin panel. With the content API's `SITE_REBUILD_HOOK_URL`
secret set (an Amplify incoming webhook), the site rebuilds on every save;
without it, the change shows on the next deploy. Locally, `npm run
sync:travel` fetches the current data when `NEXT_PUBLIC_API_BASE_URL` is set.
