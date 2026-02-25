export function AboutTab() {
  return (
    <section
      id="about-panel"
      role="tabpanel"
      aria-labelledby="about-tab"
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
    >
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">About AI Lab</h2>
      <p>
        AI Lab lets you explore specialized agents backed by curated system prompts for delivery, planning,
        writing, and leadership workflows.
      </p>
      <p>
        Costs shown are approximate estimates based on your prompt size, model pricing, and max output cap.
        Estimates are designed to keep each run predictable.
      </p>
      <p>
        Runs are platform-funded, so you do not pay directly. Wallet connection is used for identity, lightweight
        rate limiting, and optional hash logging in future versions.
      </p>
      <p>
        If hash logging is enabled later, only a proof hash would be recorded on-chain for auditability—never raw
        conversation text.
      </p>
    </section>
  );
}
