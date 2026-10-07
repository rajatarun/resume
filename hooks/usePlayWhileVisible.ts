"use client";

import { useEffect, type MutableRefObject, type RefObject } from "react";

/**
 * Keeps a muted background video playing while it is on screen.
 *
 * Browsers pause muted videos that scroll out of view (mobile Safari and
 * Chrome do it to save power) and only resume them automatically when they
 * were started by the `autoplay` attribute. Ours start from script, so that
 * reduced-motion visitors never see motion, and nothing restarted them:
 * scroll past the landing and back, and the walk sat frozen.
 *
 * So this does it explicitly: pause when the container leaves the viewport or
 * the tab is hidden, play again when it is back, unless the visitor pressed
 * Pause (`userPausedRef`) or `enabled` is false (reduced motion, hidden design).
 * `onPlayingChange` follows the video's own play/pause events, so a Play/Pause
 * button always says what the video is actually doing.
 */
export function usePlayWhileVisible({
  videoRef,
  containerRef,
  enabled,
  userPausedRef,
  onPlayingChange,
  deps = []
}: {
  videoRef: RefObject<HTMLVideoElement>;
  containerRef: RefObject<HTMLElement>;
  enabled: boolean;
  userPausedRef: MutableRefObject<boolean>;
  onPlayingChange?: (playing: boolean) => void;
  /** Re-attach when the <video> element itself is replaced (e.g. a new source on rotation). */
  deps?: readonly unknown[];
}) {
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    let inView = true;
    const sync = () => {
      const shouldPlay = enabled && inView && !document.hidden && !userPausedRef.current;
      if (shouldPlay && video.paused) {
        video.play().catch(() => {
          // Autoplay refused (data saver, low power): the poster stays, and
          // the Play button still works.
        });
      } else if (!shouldPlay && !video.paused && (!inView || document.hidden)) {
        video.pause();
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    const onVisibility = () => sync();
    const onPlay = () => onPlayingChange?.(true);
    const onPause = () => onPlayingChange?.(false);
    document.addEventListener("visibilitychange", onVisibility);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);
}
