"use client";

type HowItWorksModalProps = {
  open: boolean;
  onClose: () => void;
};

export function HowItWorksModal({ open, onClose }: HowItWorksModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">How it works</h2>
          <button onClick={onClose} className="focus-ring rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            Close
          </button>
        </div>
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p>Pick an agent, review estimated cost, then run. The platform funds usage within safety caps.</p>
          <p>
            Example: base $0.0040 + variable cost from input/output tokens (e.g. 250 input + 700 output on gpt-mini)
            results in an estimated total around $0.0057.
          </p>
          <p>Wallet connection is identity-only and helps enforce daily limits per wallet address.</p>
        </div>
      </div>
    </div>
  );
}
