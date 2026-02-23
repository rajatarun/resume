import { RecruiterGate } from "@/components/web3/RecruiterGate";

export const dynamic = "force-dynamic";

const isRecruiterGateEnabled = () => {
  const value = process.env.ENABLE_RECRUITER_GATE;
  return value?.trim().toLowerCase() === "true";
};

export default function RecruiterPage() {
  if (!isRecruiterGateEnabled()) {
    return (
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold">Recruiter access is temporarily unavailable</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This feature is currently disabled. Set <code>ENABLE_RECRUITER_GATE=true</code> to re-enable the recruiter panel.
        </p>
      </section>
    );
  }

  return <RecruiterGate />;
}
