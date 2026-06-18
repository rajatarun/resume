"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils/cn";

type StepKind = "user" | "llm" | "tool" | "result";

type SimStep = {
  id: string;
  kind: StepKind;
  label: string;
  detail: string;
  tokens: number;
  server?: string;
  tool?: string;
};

type Scenario = {
  id: string;
  name: string;
  goal: string;
  withoutMcp: SimStep[];
  withMcp: SimStep[];
};

const SCENARIOS: Scenario[] = [
  {
    id: "email-notes",
    name: "Email → Notes",
    goal: "Find emails about project deadlines and create follow-up notes",
    withoutMcp: [
      {
        id: "w1",
        kind: "user",
        label: "User prompt",
        detail: "Find emails about project deadlines and create follow-up notes",
        tokens: 42,
      },
      {
        id: "w2",
        kind: "llm",
        label: "LLM Call — context dump",
        detail: "Full mailbox dump embedded in system prompt: all threads, metadata, bodies inlined as raw text",
        tokens: 3240,
      },
      {
        id: "w3",
        kind: "llm",
        label: "LLM Call — filter & extract",
        detail: "Re-send filtered subset with full conversation history to identify relevant emails",
        tokens: 2620,
      },
      {
        id: "w4",
        kind: "llm",
        label: "LLM Call — draft notes",
        detail: "Re-send extracted email content + full history to compose note bodies",
        tokens: 2150,
      },
      {
        id: "w5",
        kind: "result",
        label: "Final response",
        detail: "Complete synthesis — entire conversation history re-sent for final summarization step",
        tokens: 1298,
      },
    ],
    withMcp: [
      {
        id: "m1",
        kind: "user",
        label: "User prompt",
        detail: "Find emails about project deadlines and create follow-up notes",
        tokens: 42,
      },
      {
        id: "m2",
        kind: "llm",
        label: "LLM Call — plan",
        detail: "Compact system prompt; agent decides to call search_threads with a targeted query",
        tokens: 238,
      },
      {
        id: "m3",
        kind: "tool",
        label: "search_threads",
        detail: "Structured tool call with query=\"project deadline\"; returns compact thread list JSON",
        tokens: 245,
        server: "Gmail MCP",
        tool: "search_threads",
      },
      {
        id: "m4",
        kind: "tool",
        label: "get_thread",
        detail: "Fetches only the single most relevant thread; structured response, no extra data",
        tokens: 318,
        server: "Gmail MCP",
        tool: "get_thread",
      },
      {
        id: "m5",
        kind: "tool",
        label: "create_note",
        detail: "Writes follow-up note directly via MCP; tool handles formatting and storage",
        tokens: 215,
        server: "Notes MCP",
        tool: "create_note",
      },
      {
        id: "m6",
        kind: "result",
        label: "Final response",
        detail: "Concise confirmation — no full history re-sent, only the tool results are in context",
        tokens: 312,
      },
    ],
  },
  {
    id: "search-summarize",
    name: "Search & Summarize",
    goal: "Search notes for design decisions and email a summary",
    withoutMcp: [
      {
        id: "w1",
        kind: "user",
        label: "User prompt",
        detail: "Search my notes for design decisions and draft an email summary",
        tokens: 38,
      },
      {
        id: "w2",
        kind: "llm",
        label: "LLM Call — inject notes",
        detail: "All notes corpus injected as raw text into prompt; no filtering at source",
        tokens: 4100,
      },
      {
        id: "w3",
        kind: "llm",
        label: "LLM Call — synthesize",
        detail: "Re-send selected notes + full history to extract key design decisions",
        tokens: 2880,
      },
      {
        id: "w4",
        kind: "llm",
        label: "LLM Call — draft email",
        detail: "Full context re-sent again to draft email with extracted points",
        tokens: 2310,
      },
      {
        id: "w5",
        kind: "result",
        label: "Final response",
        detail: "Entire growing conversation history re-sent for final formatting pass",
        tokens: 1540,
      },
    ],
    withMcp: [
      {
        id: "m1",
        kind: "user",
        label: "User prompt",
        detail: "Search my notes for design decisions and draft an email summary",
        tokens: 38,
      },
      {
        id: "m2",
        kind: "llm",
        label: "LLM Call — plan",
        detail: "Calls extended_search_notes with semantic query; compact tool spec in context",
        tokens: 210,
      },
      {
        id: "m3",
        kind: "tool",
        label: "extended_search_notes",
        detail: "Returns top-3 semantically relevant notes; server-side filtering, no blob dumping",
        tokens: 380,
        server: "Notes MCP",
        tool: "extended_search_notes",
      },
      {
        id: "m4",
        kind: "tool",
        label: "get_note",
        detail: "Fetches full body of the single most relevant note on demand",
        tokens: 290,
        server: "Notes MCP",
        tool: "get_note",
      },
      {
        id: "m5",
        kind: "result",
        label: "Final response",
        detail: "Email draft generated from compact structured data; no wasted context",
        tokens: 285,
      },
    ],
  },
];

const STEP_DELAY_MS = 420;

function totalTokens(steps: SimStep[]) {
  return steps.reduce((sum, s) => sum + s.tokens, 0);
}

const kindStyle: Record<StepKind, { bg: string; border: string; badge: string; icon: string }> = {
  user: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    icon: "👤",
  },
  llm: {
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-800",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
    icon: "🤖",
  },
  tool: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    icon: "🔧",
  },
  result: {
    bg: "bg-slate-50 dark:bg-slate-800/60",
    border: "border-slate-200 dark:border-slate-700",
    badge: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
    icon: "✅",
  },
};

function StepCard({ step, visible, index }: { step: SimStep; visible: boolean; index: number }) {
  const styles = kindStyle[step.kind];
  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-all duration-500",
        styles.bg,
        styles.border,
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      )}
      style={{ transitionDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-base leading-none">{styles.icon}</span>
          <span className="truncate text-xs font-semibold text-slate-900 dark:text-white">{step.label}</span>
          {step.server && (
            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
              {step.server}
            </span>
          )}
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums", styles.badge)}>
          {step.tokens.toLocaleString()} tok
        </span>
      </div>
      <p className="mt-1.5 pl-6 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{step.detail}</p>
    </div>
  );
}

function TokenBar({ label, tokens, maxTokens, color }: { label: string; tokens: number; maxTokens: number; color: string }) {
  const pct = Math.round((tokens / maxTokens) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="font-bold tabular-nums text-slate-900 dark:text-white">{tokens.toLocaleString()} tokens</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function McpSimulatorTab() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [visibleWithout, setVisibleWithout] = useState(0);
  const [visibleWith, setVisibleWith] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisibleWithout(0);
    setVisibleWith(0);
    setRunning(false);
    setDone(false);
  }, []);

  useEffect(() => {
    reset();
  }, [scenarioId, reset]);

  const runSimulation = useCallback(() => {
    reset();
    setRunning(true);

    const maxSteps = Math.max(scenario.withoutMcp.length, scenario.withMcp.length);
    let step = 0;

    function tick() {
      step += 1;
      setVisibleWithout(Math.min(step, scenario.withoutMcp.length));
      setVisibleWith(Math.min(step, scenario.withMcp.length));

      if (step < maxSteps) {
        timerRef.current = setTimeout(tick, STEP_DELAY_MS);
      } else {
        setRunning(false);
        setDone(true);
      }
    }

    timerRef.current = setTimeout(tick, 150);
  }, [scenario, reset]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const totalWithout = totalTokens(scenario.withoutMcp);
  const totalWith = totalTokens(scenario.withMcp);
  const savings = Math.round(((totalWithout - totalWith) / totalWithout) * 100);
  const maxTokens = totalWithout;

  const runningWithout = scenario.withoutMcp.slice(0, visibleWithout).reduce((s, x) => s + x.tokens, 0);
  const runningWith = scenario.withMcp.slice(0, visibleWith).reduce((s, x) => s + x.tokens, 0);

  return (
    <section
      id="mcp-simulator-panel"
      role="tabpanel"
      aria-labelledby="mcp-simulator-tab"
      className="space-y-4 pt-4"
    >
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">MCP Token Savings Simulator</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              See how MCP servers reduce token usage by replacing large context dumps with targeted tool calls.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value)}
              disabled={running}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {done ? (
              <button
                onClick={reset}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Reset
              </button>
            ) : (
              <button
                onClick={runSimulation}
                disabled={running}
                className={cn(
                  "rounded-lg px-4 py-1.5 text-xs font-semibold transition",
                  running
                    ? "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                    : "bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                )}
              >
                {running ? "Simulating…" : "▶ Run Simulation"}
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Scenario: </span>
            {scenario.goal}
          </p>
        </div>
      </div>

      {/* MCP Architecture Overview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Connected MCP Servers
        </h3>
        <div className="flex flex-wrap gap-3">
          {[
            {
              name: "Gmail MCP",
              color: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
              dot: "bg-red-400",
              tools: ["search_threads", "get_thread", "list_labels", "label_thread"],
            },
            {
              name: "Notes MCP",
              color: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
              dot: "bg-amber-400",
              tools: ["search_notes", "create_note", "get_note", "extended_search_notes"],
            },
            {
              name: "GitHub MCP",
              color: "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60",
              dot: "bg-slate-400",
              tools: ["search_code", "list_issues", "get_commit", "search_pull_requests"],
            },
          ].map((srv) => (
            <div key={srv.name} className={cn("flex-1 rounded-xl border p-3", srv.color)} style={{ minWidth: "200px" }}>
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", srv.dot)} />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{srv.name}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {srv.tools.map((t) => (
                  <span key={t} className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:bg-slate-900/50 dark:text-slate-400">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side-by-side simulation */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Without MCP */}
        <div className="rounded-2xl border border-red-200 bg-white dark:border-red-900 dark:bg-slate-900">
          <div className="flex items-center justify-between rounded-t-2xl bg-red-50 px-4 py-3 dark:bg-red-950/30">
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">Without MCP</p>
              <p className="text-[11px] text-red-600 dark:text-red-400">Raw LLM calls — full context re-injected each step</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold tabular-nums text-red-700 dark:text-red-300">
                {runningWithout.toLocaleString()}
              </p>
              <p className="text-[10px] text-red-500">tokens used</p>
            </div>
          </div>
          <div className="space-y-2 p-3">
            {scenario.withoutMcp.map((step, i) => (
              <StepCard key={step.id} step={step} visible={i < visibleWithout} index={i} />
            ))}
          </div>
        </div>

        {/* With MCP */}
        <div className="rounded-2xl border border-emerald-200 bg-white dark:border-emerald-900 dark:bg-slate-900">
          <div className="flex items-center justify-between rounded-t-2xl bg-emerald-50 px-4 py-3 dark:bg-emerald-950/30">
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">With MCP</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Targeted tool calls — only relevant data fetched</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                {runningWith.toLocaleString()}
              </p>
              <p className="text-[10px] text-emerald-500">tokens used</p>
            </div>
          </div>
          <div className="space-y-2 p-3">
            {scenario.withMcp.map((step, i) => (
              <StepCard key={step.id} step={step} visible={i < visibleWith} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Token savings summary */}
      {done && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Token Savings Summary</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">MCP eliminated redundant context and bulk data injection</p>
            </div>
            <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 px-4 py-2 text-center dark:border-emerald-700 dark:bg-emerald-950/40">
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{savings}%</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-500">token savings</p>
            </div>
          </div>

          <div className="space-y-3">
            <TokenBar label="Without MCP" tokens={totalWithout} maxTokens={maxTokens} color="bg-red-400" />
            <TokenBar label="With MCP" tokens={totalWith} maxTokens={maxTokens} color="bg-emerald-400" />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Tokens saved", value: (totalWithout - totalWith).toLocaleString(), color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Cost reduction", value: `~${savings}%`, color: "text-emerald-600 dark:text-emerald-400" },
              { label: "LLM calls (w/ MCP)", value: String(scenario.withMcp.filter((s) => s.kind === "llm").length), color: "text-violet-600 dark:text-violet-400" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                <p className={cn("text-xl font-black tabular-nums", stat.color)}>{stat.value}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-amber-50 p-3 dark:bg-amber-950/20">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              <span className="font-semibold">Why?</span> Without MCP, the agent embeds raw data (full email bodies,
              note corpora) directly into the LLM context on every step. With MCP, structured tool calls fetch only
              the exact records needed — tool definitions are compact, responses are targeted, and context stays lean.
            </p>
          </div>
        </div>
      )}

      {/* Pre-run prompt */}
      {!running && !done && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-10 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Select a scenario and press <strong>▶ Run Simulation</strong> to see the trace.</p>
        </div>
      )}
    </section>
  );
}
