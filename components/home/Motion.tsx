"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/** Fades and lifts its children in once they scroll into view. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
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

/**
 * The looping desk scene behind the hero. It never autoplays for visitors who
 * ask for reduced motion (they get the poster), and it can always be paused:
 * WCAG 2.2.2 requires that for anything moving for more than five seconds.
 * Playback starts from an effect rather than the autoPlay attribute so the
 * reduced-motion check runs before the first frame moves.
 */
export function HeroVideo({ className }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video || reduce) return;
    video.play().then(
      () => setPlaying(true),
      () => setPlaying(false)
    );
  }, [reduce]);

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

  return (
    <div className={className}>
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
        {/* WebM (VP9) is a third of the size; MP4 (H.264) covers older Safari.
            Wide screens get the 1600px cut, everything else the 960px one. */}
        <source src="/hero/tarun-desk-1600.webm" type="video/webm" media="(min-width: 1024px)" />
        <source src="/hero/tarun-desk-1600.mp4" type="video/mp4" media="(min-width: 1024px)" />
        <source src="/hero/tarun-desk-960.webm" type="video/webm" />
        <source src="/hero/tarun-desk-960.mp4" type="video/mp4" />
      </video>
      <button
        type="button"
        onClick={toggle}
        className="focus-ring absolute right-4 top-4 rounded-full border border-white/25 bg-black/25 px-3 py-1.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.25em] text-[#fbf3ea] backdrop-blur transition hover:bg-black/40 xl:right-10 xl:top-auto xl:bottom-24"
      >
        {playing ? "Pause" : "Play"}
        <span className="sr-only"> background animation</span>
      </button>
    </div>
  );
}
