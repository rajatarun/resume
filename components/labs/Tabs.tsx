"use client";

import { useRef, KeyboardEvent } from "react";
import { cn } from "@/lib/utils/cn";

export type LabTabKey = "agent-studio" | "about";

type TabsProps = {
  activeTab: LabTabKey;
  onChange: (tab: LabTabKey) => void;
};

const tabs: Array<{ key: LabTabKey; label: string }> = [
  { key: "agent-studio", label: "Agent Studio" },
  { key: "about", label: "About" }
];

export function Tabs({ activeTab, onChange }: TabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = tabs.findIndex((t) => t.key === activeTab);
    let nextIndex: number | null = null;

    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      onChange(tabs[nextIndex].key);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label="AI Lab sections"
      className="border-b border-slate-200 dark:border-slate-800"
      onKeyDown={handleKeyDown}
    >
      <div className="flex gap-4">
        {tabs.map((tab, index) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              ref={(el: HTMLButtonElement | null) => { tabRefs.current[index] = el; }}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={`${tab.key}-panel`}
              id={`${tab.key}-tab`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.key)}
              className={cn(
                "focus-ring -mb-px border-b-2 px-1 pb-3 pt-2 text-sm font-medium transition",
                isActive
                  ? "border-slate-900 text-slate-900 dark:border-white dark:text-white"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
