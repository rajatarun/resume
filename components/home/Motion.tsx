"use client";

import { useRef, type ReactNode } from "react";
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
