import type { SkillGroup } from "@/lib/resume";

export function SkillBadges({ groups }: { groups: SkillGroup[] }) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.name}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{group.name}</h3>
          <div className="flex flex-wrap gap-2">
            {group.items.map((item) => (
              <span key={item} className="rounded-full border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700">
                {item}
              </span>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
