"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    if (stored === "dark") {
      setDark(true);
      return;
    }

    if (stored === "light") {
      setDark(false);
      return;
    }

    setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      window.localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      window.localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button onClick={() => setDark((v) => !v)} className="rounded-lg border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700">
      {dark ? "Light" : "Dark"}
    </button>
  );
}
