import type { StackCategory, StackData } from "@/src/data/websiteArchitecture";

const labels: Record<StackCategory, string> = {
  cloud_services: "Cloud Services",
  tools: "Tools",
  technologies: "Technologies",
  design_patterns: "Design Patterns",
  pipelines: "Pipelines"
};

type StackGridProps = {
  stack: StackData;
};

export function StackGrid({ stack }: StackGridProps) {
  return (
    <div className="space-y-6">
      {(Object.keys(stack) as StackCategory[]).map((category) => (
        <section key={category} className="space-y-3">
          <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{labels[category]}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {stack[category].map((item) => (
              <article key={`${category}-${item.name}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      item.status === "Implemented"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.notes}</p>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
