"use client";

type PromptModalProps = {
  open: boolean;
  onClose: () => void;
  agentName: string;
  prompt: string;
};

export function PromptModal({ open, onClose, agentName, prompt }: PromptModalProps) {
  if (!open) {
    return null;
  }

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{agentName} prompt</h2>
          <button onClick={onClose} className="focus-ring rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            Close
          </button>
        </div>
        <pre className="max-h-[55vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
          {prompt}
        </pre>
        <div className="mt-3 flex justify-end">
          <button onClick={copyPrompt} className="focus-ring rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Copy prompt
          </button>
        </div>
      </div>
    </div>
  );
}
