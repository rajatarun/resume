"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getScenes, ApiError } from "@/lib/deviceweave";

function toErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Unable to reach DeviceWeave API. Check your connection.";
}

export function ScenesTab() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["scenes"],
    queryFn: getScenes,
  });

  const scenes = data?.scenes ?? [];

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      <div className="rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
        Scenes are defined server-side. Trigger them via natural language using{" "}
        <code className="rounded bg-blue-100 px-1 font-mono dark:bg-blue-900">
          POST /execute
        </code>{" "}
        — e.g.{" "}
        <code className="rounded bg-blue-100 px-1 font-mono dark:bg-blue-900">
          {"{ command: 'work mode' }"}
        </code>
      </div>

      {isError && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {toErrorMessage(error)}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded border bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : scenes.length === 0 ? (
        <p className="text-sm text-slate-500">No scenes found.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {scenes.map((scene) => (
            <div key={scene.id} className="rounded border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium">{scene.name}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {scene.description}
                  </p>
                  <span className="mt-2 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-700">
                    {scene.action_count} device action
                    {scene.action_count !== 1 ? "s" : ""}
                  </span>
                </div>
                {scene.sample_phrases.length > 0 && (
                  <button
                    type="button"
                    className="shrink-0 text-xs text-slate-500 underline"
                    onClick={() => toggleExpand(scene.id)}
                  >
                    {expanded[scene.id] ? "Hide phrases" : "Show phrases"}
                  </button>
                )}
              </div>
              {expanded[scene.id] && scene.sample_phrases.length > 0 && (
                <div className="mt-3 space-y-1 border-t pt-3">
                  {scene.sample_phrases.map((phrase, i) => (
                    <p
                      key={i}
                      className="text-xs text-slate-600 dark:text-slate-400"
                    >
                      &ldquo;{phrase}&rdquo;
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
