"use client";

type FaqQuestionsProps = {
  onSelect: (question: string) => void;
  isDisabled: boolean;
};

const FAQ_QUESTIONS = [
  "What kind of engineer is Tarun Raja, and what problems does he specialize in solving?",
  "How does Tarun combine software engineering leadership with hands-on technical architecture?",
  "What experience does Tarun have in fintech, banking systems, and regulated enterprise environments?",
  "What is Tarun's expertise in cloud architecture, DevOps, and site reliability engineering?",
  "How has Tarun used AI, LLMs, agentic workflows, and orchestration frameworks in real projects?",
  "What is TaskWeave, and how does it reflect Tarun's approach to building modular AI systems?",
  "What do projects like ContextWeave, TeamWeave, selfmcp-server, and mcp-observatory say about Tarun's technical direction?",
  "How does Tarun design systems for governance, observability, resilience, and production readiness?",
  "What kinds of teams has Tarun led, and how does he drive execution across DevOps, SRE, and application engineering?",
  "Why would a company choose Tarun for roles involving platform engineering, AI infrastructure, developer experience, or technical leadership?"
];

export function FaqQuestions({ onSelect, isDisabled }: FaqQuestionsProps) {
  return (
    <aside className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Suggested questions</p>
      <ul className="flex flex-col gap-2">
        {FAQ_QUESTIONS.map((question, index) => (
          <li key={index}>
            <button
              type="button"
              onClick={() => onSelect(question)}
              disabled={isDisabled}
              className="group flex w-full items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-sky-500 dark:hover:bg-sky-950/40 dark:hover:text-sky-300"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 transition group-hover:bg-sky-200 group-hover:text-sky-700 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-400 dark:group-hover:bg-sky-800 dark:group-hover:text-sky-300">
                {index + 1}
              </span>
              <span className="leading-snug text-slate-700 dark:text-slate-300 group-hover:text-sky-700 dark:group-hover:text-sky-300">{question}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
