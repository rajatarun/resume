import { ReactNode } from "react";

type PageShellProps = {
  title: string;
  intro: string;
  children: ReactNode;
};

export function PageShell({ title, intro, children }: PageShellProps) {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">Tarun Raja</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-slate-600 dark:text-slate-300">{intro}</p>
      </section>
      {children}
    </div>
  );
}
