import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export function PillLink({
  href,
  label,
  highlight = false,
}: {
  href: ComponentProps<typeof Link>["href"];
  label: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "focus-ring inline-flex w-full items-center justify-between rounded-full border px-6 py-4 text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-md sm:text-base",
        highlight
          ? "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-100"
          : "border-slate-300 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      )}
      aria-label={label}
    >
      <span>{label}</span>
      <span aria-hidden>→</span>
    </Link>
  );
}
