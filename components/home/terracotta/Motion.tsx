"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useActiveHomeDesign, useHomeDesignSettled } from "@/lib/homeDesign";

/**
 * Fades and lifts its children in once they scroll into view. `onMount`
 * plays it on load instead: for content that starts on screen, like the hero.
 * A scroll trigger there can miss entirely: on a short landscape phone the
 * hero's lower lines sit inside the -80px margin and never count as in view.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  onMount = false
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  onMount?: boolean;
}) {
  const reduce = useReducedMotion();
  const shown = { opacity: 1, y: 0 };
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      animate={onMount ? shown : undefined}
      whileInView={onMount ? undefined : shown}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** The hero drifts up and fades as the next section scrolls over it. */
export function HeroParallax({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, reduce ? 1 : 0.15]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y, opacity }} className="h-full">
        {children}
      </motion.div>
    </div>
  );
}

/** Bars grow from the baseline when the card enters the viewport. */
export function BarChart({ bars, highlight }: { bars: number[]; highlight: number }) {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden="true" className="flex h-40 items-end gap-2 sm:gap-3">
      {bars.map((height, index) => (
        <motion.span
          key={index}
          className={
            index === highlight
              ? "flex-1 rounded-t-sm bg-gradient-to-b from-[#f0714a] to-[#b8441f]"
              : "flex-1 rounded-t-sm bg-gradient-to-b from-white/25 to-white/5"
          }
          style={{ height: `${height}%`, transformOrigin: "bottom" }}
          initial={reduce ? false : { scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </div>
  );
}

/** Tracks a media query; false until mounted, so the server render never includes what it gates. */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/**
 * The looping desk scene in the hero, only while terracotta is the design
 * showing. Two layouts:
 *   - wide (1280px and up): behind the hero's right side (`className`);
 *   - landscape, narrower than that (phones on their side, small laptops):
 *     a card under the headline (`cardClassName`).
 * Portrait screens narrower than 1280px show the photo instead, and since
 * this renders nothing there, they never download the video. It never
 * autoplays for visitors who ask for reduced motion (they get the poster),
 * and it can always be paused: WCAG 2.2.2 requires that for anything moving
 * for more than five seconds.
 * Playback starts from an effect rather than the autoPlay attribute so the
 * reduced-motion check runs before the first frame moves.
 */
export function HeroVideo({ className, cardClassName }: { className?: string; cardClassName?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const wide = useMediaQuery("(min-width: 1280px)");
  const landscape = useMediaQuery("(orientation: landscape)");
  const layout = wide ? "wide" : landscape ? "card" : null;
  // Every design is in the page; a hidden terracotta must not fetch the video,
  // and neither should one that is about to be swapped for the saved design.
  const active = useActiveHomeDesign();
  const settled = useHomeDesignSettled();
  const shown = active === "terracotta" && settled;
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video || reduce) return;
    video.play().then(
      () => setPlaying(true),
      () => setPlaying(false)
    );
  }, [reduce, layout, shown]);

  function toggle() {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      void video.play().then(() => setPlaying(true));
    } else {
      video.pause();
      setPlaying(false);
    }
  }

  if (!layout || !shown) return null;

  return (
    <div className={layout === "wide" ? className : cardClassName}>
      <video
        ref={ref}
        aria-hidden="true"
        className="h-full w-full object-cover object-[70%_50%]"
        poster="/hero/tarun-desk-poster.jpg"
        muted
        loop
        playsInline
        preload="auto"
      >
        {/* WebM (VP9) is a third of the size; MP4 (H.264) covers older Safari. */}
        <source src="/hero/tarun-desk-1600.webm" type="video/webm" />
        <source src="/hero/tarun-desk-1600.mp4" type="video/mp4" />
      </video>
      <button
        type="button"
        onClick={toggle}
        className={`focus-ring absolute ${layout === "wide" ? "bottom-24 right-10" : "right-3 top-3"} rounded-full border border-white/25 bg-black/25 px-3 py-1.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.25em] text-[#fbf3ea] backdrop-blur transition hover:bg-black/40`}
      >
        {playing ? "Pause" : "Play"}
        <span className="sr-only"> background animation</span>
      </button>
    </div>
  );
}
