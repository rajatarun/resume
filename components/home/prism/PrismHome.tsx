import { PrismLanding } from "@/components/home/prism/PrismLanding";
import { editorialFontVariables } from "@/components/home/terracotta/fonts";
import { About, Contact, Experience, Projects } from "@/components/home/terracotta/TerracottaHome";

/**
 * "prism": one person, four sides. A full-screen "Know Tarun as…" landing
 * where the avatar walks from desk to camera to books to café (PrismLanding),
 * then terracotta's About / Experience / Projects / Contact, which is where
 * "Software Architect" leads. Ids are prefixed so they never collide with terracotta's
 * hidden copies on the same page.
 * Screenshots: docs/home-designs/README.md#prism
 */
export function PrismHome() {
  return (
    // Full-bleed, stepping out of the root layout's padded max-w-6xl <main>
    // exactly as terracotta does.
    <div
      className={`${editorialFontVariables} relative left-1/2 -mb-16 -mt-24 w-screen -translate-x-1/2 font-[family-name:var(--font-body)]`}
    >
      <PrismLanding />
      <About idPrefix="prism-" />
      <Experience idPrefix="prism-" />
      <Projects idPrefix="prism-" />
      <Contact idPrefix="prism-" />
    </div>
  );
}
