"use client";

import { motion } from "framer-motion";
import type { SkillGroup } from "@/lib/resume";

type SkillGroupWithDepth = SkillGroup & { yearsExp: number };

const BAR_COLORS = [
  { bar: "bg-blue-500", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { bar: "bg-violet-500", badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  { bar: "bg-cyan-500", badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" },
  { bar: "bg-amber-500", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  { bar: "bg-sky-500", badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" },
  { bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
];

const MAX_HEIGHT_PX = 160;
const MAX_YEARS = 10;

export function SkillDepthChart({ groups }: { groups: SkillGroupWithDepth[] }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-slate-900">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        Breadth &amp; Depth
      </p>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        Years of hands-on experience across engineering domains
      </p>

      <div className="flex items-end gap-1.5 sm:gap-3 pb-2">
        {groups.map((group, i) => {
          const color = BAR_COLORS[i % BAR_COLORS.length];
          const targetHeight = Math.round((group.yearsExp / MAX_YEARS) * MAX_HEIGHT_PX);
          const topSkills = group.items.slice(0, 2);

          return (
            <div key={group.name} className="flex flex-1 flex-col items-center gap-1 sm:gap-2">
              {/* Bar container — fixed height so bars share a common baseline */}
              <div
                className="relative flex w-full items-end justify-center"
                style={{ height: `${MAX_HEIGHT_PX}px` }}
              >
                <motion.div
                  className={`relative w-full rounded-t-md sm:rounded-t-lg ${color.bar}`}
                  initial={{ height: 0 }}
                  animate={{ height: targetHeight }}
                  transition={{ duration: 0.7, delay: i * 0.08, ease: "easeOut" }}
                >
                  {/* Years label above the bar */}
                  <span className="absolute -top-5 left-0 right-0 text-center text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                    {group.yearsExp}yr
                  </span>
                </motion.div>
              </div>

              {/* Category name */}
              <p className="text-center text-[9px] sm:text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-tight">
                {group.name}
              </p>

              {/* Top 2 skills as tiny pills — hidden on small screens */}
              <div className="hidden sm:flex flex-wrap justify-center gap-1">
                {topSkills.map((skill) => (
                  <span
                    key={skill}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${color.badge}`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Y-axis legend */}
      <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
        <span className="h-px w-6 bg-zinc-300 dark:bg-zinc-600" />
        Bar height = years of experience (max 10)
      </div>
    </div>
  );
}
