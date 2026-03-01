import type { Metadata } from "next";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { RecruiterGate } from "@/components/web3/RecruiterGate";
import { routeMetadata } from "@/src/seo/seo.config";

export const metadata: Metadata = routeMetadata["/recruiter"];

const isRecruiterGateEnabled = () => {
  const value = process.env.ENABLE_RECRUITER_GATE;
  return value?.trim().toLowerCase() === "true";
};

export default function RecruiterPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Recruiter Information — Tarun Raja</h1>
        <VerifiedBadge />
      </div>
      <RecruiterGate requireWalletGate={isRecruiterGateEnabled()} />
    </div>
  );
}
