import { ArticleStatus } from "@/lib/admin/types";

const classMap: Record<ArticleStatus, string> = {
  DRAFT: "bg-slate-200 text-slate-800",
  REVISION_REQUESTED: "bg-amber-100 text-amber-800",
  AWAITING_APPROVAL: "bg-blue-100 text-blue-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  PUBLISHED: "bg-purple-100 text-purple-800",
  FAILED: "bg-red-100 text-red-800"
};

export function StatusBadge({ status }: { status: ArticleStatus }) {
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${classMap[status]}`}>{status}</span>;
}
