"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PresenceBar } from "./components/PresenceBar";
import { HomeTab } from "./components/HomeTab";
import { DevicesTab } from "./components/DevicesTab";
import { ScenesTab } from "./components/ScenesTab";
import { LearningsTab } from "./components/LearningsTab";
import { PoliciesTab } from "./components/PoliciesTab";

const SUB_TABS = ["home", "devices", "scenes", "learnings", "policies"] as const;
type SubTab = (typeof SUB_TABS)[number];

const TAB_LABELS: Record<SubTab, string> = {
  home: "Home",
  devices: "Devices",
  scenes: "Scenes",
  learnings: "Learnings",
  policies: "Policies",
};

export default function HomeAutomationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const raw = searchParams.get("tab");
  const activeTab: SubTab =
    (SUB_TABS as readonly string[]).includes(raw ?? "") ? (raw as SubTab) : "home";

  const setTab = (tab: SubTab) => {
    router.push(`/admin/home-automation?tab=${tab}`);
  };

  return (
    <div className="space-y-4">
      <PresenceBar />
      <div className="flex flex-wrap gap-2 border-b">
        {SUB_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              activeTab === tab
                ? "border-slate-900 font-medium"
                : "border-transparent text-slate-500"
            }`}
            onClick={() => setTab(tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>
      {activeTab === "home" && <HomeTab />}
      {activeTab === "devices" && <DevicesTab />}
      {activeTab === "scenes" && <ScenesTab />}
      {activeTab === "learnings" && <LearningsTab />}
      {activeTab === "policies" && <PoliciesTab />}
    </div>
  );
}
