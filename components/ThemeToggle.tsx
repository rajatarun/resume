"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  return (
    <button onClick={() => setDark((v) => !v)} className="rounded-lg border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700">
      {dark ? "Light" : "Dark"}
    </button>
  );
}
