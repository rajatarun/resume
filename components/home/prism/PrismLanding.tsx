"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useActiveHomeDesign, useHomeDesignSettled } from "@/lib/homeDesign";
import { PRISM_STATIONS, stationIndexAt, stationProgressAt } from "@/lib/prismStations";

const SOURCES = {
  landscape: { webm: "/prism/walk-landscape.webm", mp4: "/prism/walk-landscape.mp4" },
  portrait: { webm: "/prism/walk-portrait.webm", mp4: "/prism/walk-portrait.mp4" }
} as const;

/**
 * "Know Tarun as…": the avatar walks from his desk past his camera and his
 * books to a café, and the side of him each stop stands for lights up as he
 * reaches it. Picking one jumps the walk there.
 *
 * Portrait screens get a portrait cut of the same walk (cropped around him),
 * landscape the full frame; turning the phone swaps the file and keeps the
 * place in the walk. The posters underneath are plain <img>s chosen by CSS,
 * so something correct shows before any script runs, for reduced-motion
 * visitors (who never get autoplay), and while the video loads. The video
 * itself only mounts once prism is the design showing and settled, so a
 * hidden prism never downloads it.
 */
export function PrismLanding() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef(0);
  const userPausedRef = useRef(false);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);

  const reduce = useReducedMotion();
  const portrait = useMediaQuery("(orientation: portrait)");
  const activeDesign = useActiveHomeDesign();
  const settled = useHomeDesignSettled();
  const shown = activeDesign === "prism" && settled;
  const source = portrait ? SOURCES.portrait : SOURCES.landscape;

  // Follow the video: which stop it is at, and how far through it.
  useEffect(() => {
    if (!shown) return;
    let frame = 0;
    const tick = () => {
      const video = videoRef.current;
      if (video && !video.paused) {
        timeRef.current = video.currentTime;
        setActive((current) => {
          const next = stationIndexAt(video.currentTime);
          return next === current ? current : next;
        });
        if (progressRef.current) {
          progressRef.current.style.transform = `scaleX(${stationProgressAt(video.currentTime)})`;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [shown]);

  // A new file (first mount, or the phone turned): resume where the walk was.
  function onLoadedMetadata() {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = timeRef.current;
    if (!reduce && !userPausedRef.current) {
      video.play().then(
        () => setPlaying(true),
        () => setPlaying(false)
      );
    }
  }

  function goTo(index: number) {
    const station = PRISM_STATIONS[index];
    setActive(index);
    timeRef.current = station.seekTo;
    if (progressRef.current) progressRef.current.style.transform = "scaleX(0)";
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = station.seekTo;
    if (!reduce && !userPausedRef.current && video.paused) {
      void video.play().then(() => setPlaying(true));
    }
  }

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPausedRef.current = false;
      void video.play().then(() => setPlaying(true));
    } else {
      userPausedRef.current = true;
      video.pause();
      setPlaying(false);
    }
  }

  const station = PRISM_STATIONS[active];

  return (
    <header
      data-nav-tone="dark"
      className="relative h-[100svh] min-h-[540px] overflow-hidden bg-[#1c120e] text-[#fbf3ea] landscape:min-h-[360px]"
    >
      {/* Poster: correct before any script runs, and all reduced motion gets.
          One <img> the browser picks by orientation, so only one downloads;
          lazy, so it is not fetched at all while prism is a hidden design. */}
      <picture>
        <source media="(orientation: portrait)" srcSet="/prism/walk-portrait-poster.jpg" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/prism/walk-landscape-poster.jpg"
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </picture>
      {shown && (
        <video
          key={portrait ? "portrait" : "landscape"}
          ref={videoRef}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          poster={portrait ? "/prism/walk-portrait-poster.jpg" : "/prism/walk-landscape-poster.jpg"}
          muted
          loop
          playsInline
          preload="auto"
          onLoadedMetadata={onLoadedMetadata}
        >
          <source src={source.webm} type="video/webm" />
          <source src={source.mp4} type="video/mp4" />
        </video>
      )}

      {/* Legibility: a wash behind the text, left in landscape, top and bottom in portrait. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#1c120e]/90 via-[#1c120e]/60 via-40% to-transparent to-75% portrait:hidden"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(28,18,14,0.85)_0%,rgba(28,18,14,0)_34%,rgba(28,18,14,0)_48%,rgba(28,18,14,0.92)_78%)] landscape:hidden"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#1c120e]/80 to-transparent portrait:hidden"
      />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col px-6 pb-8 pt-24 sm:px-10 portrait:justify-between landscape:justify-center landscape:pt-20">
        <div>
          <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em] text-[#f7c9b0]">
            {"// Tarun Raja"}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.6rem,4.2vh,2.6rem)] leading-none text-[#fbe3d4]">
            Know Tarun as
          </h1>
        </div>

        <div>
          <ol aria-label="Ways to know Tarun" className="mt-4 space-y-1 landscape:mt-5">
            {PRISM_STATIONS.map((item, index) => {
              const isActive = index === active;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => goTo(index)}
                    aria-pressed={isActive}
                    className="focus-ring group flex items-baseline gap-4 rounded text-left"
                  >
                    <span
                      className={`w-6 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.2em] transition-colors duration-500 ${
                        isActive ? "text-[#f0714a]" : "text-[#fbf3ea]/45"
                      }`}
                    >
                      0{index + 1}
                    </span>
                    <span
                      className={`font-[family-name:var(--font-display)] leading-[1.02] transition-all duration-500 whitespace-nowrap text-[clamp(1.75rem,min(7.2vh,9vw),4.75rem)] ${
                        isActive ? "text-[#fbf3ea] italic" : "text-[#fbf3ea]/50 group-hover:text-[#fbf3ea]/80"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className="sr-only">: {item.scene}</span>
                  </button>
                  {isActive && (
                    <span aria-hidden="true" className="ml-10 mt-1 block h-px max-w-xs bg-white/15">
                      <span
                        ref={progressRef}
                        className="block h-full origin-left scale-x-0 bg-[#f0714a]"
                      />
                    </span>
                  )}
                </li>
              );
            })}
          </ol>

          {/* What the lit stop stands for. Not a live region: it changes every
              couple of seconds on its own, which would talk over a screen reader. */}
          <div className="ml-10 mt-5 min-h-[4.5rem] max-w-md landscape:max-lg:min-h-[3.5rem]">
            <p className="text-base leading-relaxed text-[#fbe3d4] landscape:max-lg:text-sm">{station.blurb}</p>
            <p className="mt-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.25em]">
              {station.href === null ? (
                <span className="text-[#fbf3ea]/55">{station.hrefLabel}</span>
              ) : station.href.startsWith("#") ? (
                <a href={station.href} className="focus-ring border-b border-[#fbf3ea]/50 pb-0.5 hover:border-[#fbf3ea]">
                  {station.hrefLabel} →
                </a>
              ) : (
                <Link
                  href={station.href as "/publications"}
                  className="focus-ring border-b border-[#fbf3ea]/50 pb-0.5 hover:border-[#fbf3ea]"
                >
                  {station.hrefLabel} →
                </Link>
              )}
            </p>
          </div>
        </div>
      </div>

      {shown && (
        <button
          type="button"
          onClick={togglePlayback}
          className="focus-ring absolute right-4 top-20 z-10 rounded-full border border-white/25 bg-black/30 px-3 py-1.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.25em] text-[#fbf3ea] backdrop-blur transition hover:bg-black/45 sm:right-8 landscape:bottom-6 landscape:top-auto"
        >
          {playing ? "Pause" : "Play"}
          <span className="sr-only"> the walk</span>
        </button>
      )}
    </header>
  );
}
