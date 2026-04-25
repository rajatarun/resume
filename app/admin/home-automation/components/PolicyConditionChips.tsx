"use client";

import { Fragment } from "react";
import { Condition } from "@/lib/deviceweave";

function conditionToText(c: Condition): string {
  if (c.field === "temperature") {
    return `Temp ${c.operator} ${String(c.value)}°F`;
  }
  if (c.field === "humidity") {
    return `Humidity ${c.operator} ${String(c.value)}%`;
  }
  if (c.field === "time_hour") {
    const hour = c.value as number;
    const hour12 = hour % 12 || 12;
    const ampm = hour < 12 ? "AM" : "PM";
    if (c.operator === ">=") return `After ${hour12} ${ampm}`;
    if (c.operator === "<=") return `Before ${hour12} ${ampm}`;
    return `Time ${c.operator} ${hour12} ${ampm}`;
  }
  if (c.field === "is_home") {
    if (c.value === false) return "Nobody home";
    if (c.value === true) return "When home";
  }
  return `${c.field} ${c.operator} ${String(c.value)}`;
}

export function PolicyConditionChips({
  conditions,
}: {
  conditions: Condition[];
}) {
  if (conditions.length === 0) {
    return <span className="text-xs text-slate-400">No conditions</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1">
      {conditions.map((c, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <span className="text-xs font-medium text-slate-400">AND</span>
          )}
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-700">
            {conditionToText(c)}
          </span>
        </Fragment>
      ))}
    </div>
  );
}
