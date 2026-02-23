export type RecruiterMode = "Recruiter Mode" | "CTO Mode" | "Engineer Mode";

export function ChatPane({ mode }: { mode: RecruiterMode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="text-lg font-semibold">Mode Workspace</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Chat in {mode} is coming soon.</p>
    </section>
  );
}
