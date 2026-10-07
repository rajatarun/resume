# Homepage designs

The homepage at `/` can be any of the designs below. Which one is live is a
single setting, `NEXT_PUBLIC_HOME_VARIANT`, set to the design's **flag value**.

| Design | Flag value | In one line |
|--------|------------|-------------|
| [Terracotta](#terracotta) | `terracotta` | **Default.** Editorial: terracotta hero with the animated desk scene, glass nav |
| [Midnight](#midnight) | `midnight` | The original: dark navy gradient hero card with portrait and expertise cards |

## How to switch

1. In Amplify: **App settings → Environment variables**, set
   `NEXT_PUBLIC_HOME_VARIANT` to a flag value from the table.
2. Redeploy. The site is a static export, so the value is read when it builds.

Unset, misspelled or unknown values fall back to `terracotta`
(`lib/featureFlags.ts`, covered by `__tests__/featureFlags.test.ts`).

Locally: `NEXT_PUBLIC_HOME_VARIANT=midnight npm run dev`.

## Adding a design

1. Build it as a component under `components/home/<name>/`.
2. Add `<name>` to `HOME_VARIANTS` in `lib/featureFlags.ts`.
3. Add it to the `homes` record in `app/page.tsx`. That record is typed over
   every variant, so skipping this step fails `npm run typecheck`.
4. Add a section here with screenshots (desktop 1440×900, full page, and
   mobile 390×844), taken from a production build with the flag set.

---

## Terracotta

**Flag value:** `terracotta` (default) · **Code:** `components/home/terracotta/`

An editorial portfolio in the style of a designer's showreel. It uses serif
display type (Instrument Serif) with monospace labels (JetBrains Mono).

- **Hero:** full-bleed terracotta. On desktop (1280px and wider), a looping
  3D-animated video of Tarun at his standing desk, gesturing to the monitors.
  Narrower screens show the portrait photo instead and never download the
  video. The video has a Pause button and stays still for visitors who prefer
  reduced motion.
- **Nav:** a floating liquid-glass pill whose tint follows the section beneath
  it (clear over the hero, frosted over light sections, smoky over dark ones).
  This changes `TopNav` on the homepage only.
- **Sections:** (01) About with skills, education and certifications;
  (02) "Where I've worked" timeline; (03) "Things I've built", a dark project
  grid with animated bar charts; (04) Contact.
- Skills, timeline, education and certifications come from `data/resume.json`.

| Desktop | Mobile |
|---------|--------|
| ![Terracotta, desktop](terracotta/desktop.jpg) | ![Terracotta, mobile](terracotta/mobile.jpg) |

<details>
<summary>Full page, desktop</summary>

![Terracotta, full page](terracotta/desktop-full.jpg)

</details>

## Midnight

**Flag value:** `midnight` · **Code:** `components/home/midnight/`

The homepage as it was before the editorial redesign.

- **Hero:** a rounded dark navy-to-sky gradient card with the headline
  "Tarun Raja — Senior Software Engineering Leader", the portrait, and
  "Let's chat", "Chat about me" and "Explore AI Lab" buttons.
- **Sections:** Expertise Snapshot (three cards), Featured Work & Outcomes
  (four metric tiles), a "Let's chat" call to action, and a footer row.
- Uses the standard site nav bar.

| Desktop | Mobile |
|---------|--------|
| ![Midnight, desktop](midnight/desktop.jpg) | ![Midnight, mobile](midnight/mobile.jpg) |

<details>
<summary>Full page, desktop</summary>

![Midnight, full page](midnight/desktop-full.jpg)

</details>
