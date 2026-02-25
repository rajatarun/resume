"use client";

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
  return (
    <div role="tablist" aria-label="AI Lab sections" className="border-b border-slate-200 dark:border-slate-800">
      <div className="flex gap-4">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={`${tab.key}-panel`}
              id={`${tab.key}-tab`}
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
