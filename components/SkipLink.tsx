"use client";

/**
 * Skip to main content link for keyboard and screen reader users.
 * Visually hidden until focused — appears above the sticky header.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="focus-ring absolute left-2 top-2 z-[100] -translate-y-20 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-md transition-transform focus:translate-y-0 dark:bg-slate-900 dark:text-white"
    >
      Skip to main content
    </a>
  );
}
