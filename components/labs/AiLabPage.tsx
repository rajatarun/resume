"use client";

import { useState } from "react";
import { AgentStudioTab } from "@/components/labs/AgentStudioTab";
import { AboutTab } from "@/components/labs/AboutTab";
import { HowItWorksModal } from "@/components/labs/HowItWorksModal";
import { Tabs, type LabTabKey } from "@/components/labs/Tabs";
import { cn } from "@/lib/utils/cn";

export function AiLabPage() {
  const [activeTab, setActiveTab] = useState<LabTabKey>("agent-studio");
  const [isHowItWorksOpen, setHowItWorksOpen] = useState(false);
  const [isPolygonConnected, setPolygonConnected] = useState(false);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">AI Lab</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Explore specialized agents. See approximate cost before you run.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                isPolygonConnected
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              )}
            >
              Network: Polygon
            </span>
            <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Platform-funded
            </span>
            <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Max: $0.02/run
            </span>
            <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Daily cap: $0.10/wallet
            </span>
            <button
              onClick={() => setHowItWorksOpen(true)}
              className="focus-ring rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              How it works
            </button>
          </div>
        </div>
      </section>

      <Tabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "agent-studio" ? (
        <AgentStudioTab onPolygonStatusChange={setPolygonConnected} />
      ) : (
        <AboutTab />
      )}

      <HowItWorksModal open={isHowItWorksOpen} onClose={() => setHowItWorksOpen(false)} />
    </main>
  );
}
