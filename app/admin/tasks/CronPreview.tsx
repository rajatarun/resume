"use client";

import cronstrue from "cronstrue";

interface CronPreviewProps {
  expression: string;
}

export function CronPreview({ expression }: CronPreviewProps) {
  if (!expression.trim()) return null;

  let description = "";
  let isValid = true;
  try {
    description = cronstrue.toString(expression, { throwExceptionOnParseError: true });
  } catch {
    isValid = false;
    description = "Invalid cron expression";
  }

  return (
    <p className={`mt-1 text-xs ${isValid ? "text-slate-500" : "text-red-500"}`}>
      {description}
    </p>
  );
}

interface PromptPreviewProps {
  prompt: string;
  variables: Record<string, string>;
  input: Record<string, string | string[]>;
}

export function PromptPreview({ prompt, variables, input }: PromptPreviewProps) {
  if (!prompt.trim()) return null;

  const allKeys = new Set([...Object.keys(variables), ...Object.keys(input)]);
  const parts: { text: string; isPlaceholder: boolean; isDefined: boolean }[] = [];
  const regex = /\{\{(\w+)\}\}/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(prompt)) !== null) {
    if (match.index > last) {
      parts.push({ text: prompt.slice(last, match.index), isPlaceholder: false, isDefined: false });
    }
    parts.push({ text: match[0], isPlaceholder: true, isDefined: allKeys.has(match[1]) });
    last = match.index + match[0].length;
  }
  if (last < prompt.length) {
    parts.push({ text: prompt.slice(last), isPlaceholder: false, isDefined: false });
  }

  return (
    <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-2 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words dark:border-slate-700 dark:bg-slate-800">
      {parts.map((part, i) =>
        part.isPlaceholder ? (
          <mark
            key={i}
            className={`rounded px-0.5 not-italic ${
              part.isDefined
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
            }`}
          >
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </div>
  );
}
