"use client";

import { useEffect, useMemo, useState } from "react";
import { AgentList } from "@/components/labs/AgentList";
import { ChatPanel, type ChatMessage } from "@/components/labs/ChatPanel";
import { PromptModal } from "@/components/labs/PromptModal";
import { agentsCatalog, type LabAgent, type LabModel } from "@/lib/agentsCatalog";
import { estimateCost } from "@/lib/costEstimate";
import { pricingByModel } from "@/lib/pricing";
import { usdToSol } from "@/lib/solConversion";
import { estimateTokens } from "@/lib/tokenEstimate";

const PER_RUN_CAP = 0.02;
const DAILY_CAP = 0.1;
const BALANCES_STORAGE_KEY = "ai-lab-agent-balances";
const PLATFORM_POOL_STORAGE_KEY = "ai-lab-platform-pool-sol";
const INITIAL_PLATFORM_POOL_SOL = 100;

type WalletState = {
  connected: boolean;
  address: string | null;
  chainId: number | null;
  isPolygon: boolean;
};

type Usage = {
  dateKey: string;
  spentTodayUsd: number;
  runsToday: number;
};

const defaultBalances = agentsCatalog.reduce<Record<string, number>>((acc, agent) => {
  acc[agent.id] = agent.balanceSol;
  return acc;
}, {});

const usageKey = (address: string) => `ai-lab-usage:${address.toLowerCase()}`;

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function readUsage(address: string): Usage {
  const stored = localStorage.getItem(usageKey(address));
  if (!stored) {
    return { dateKey: todayKey(), spentTodayUsd: 0, runsToday: 0 };
  }
  const parsed = JSON.parse(stored) as Usage;
  if (parsed.dateKey !== todayKey()) {
    return { dateKey: todayKey(), spentTodayUsd: 0, runsToday: 0 };
  }
  return parsed;
}

function writeUsage(address: string, usage: Usage) {
  localStorage.setItem(usageKey(address), JSON.stringify(usage));
}

function readStoredBalances(): Record<string, number> {
  const stored = localStorage.getItem(BALANCES_STORAGE_KEY);
  if (!stored) {
    return defaultBalances;
  }

  const parsed = JSON.parse(stored) as Record<string, number>;
  return agentsCatalog.reduce<Record<string, number>>((acc, agent) => {
    const value = parsed[agent.id];
    acc[agent.id] = typeof value === "number" ? value : agent.balanceSol;
    return acc;
  }, {});
}

function readStoredPlatformPool(): number {
  const stored = localStorage.getItem(PLATFORM_POOL_STORAGE_KEY);
  if (!stored) {
    return INITIAL_PLATFORM_POOL_SOL;
  }
  const parsed = Number(stored);
  return Number.isFinite(parsed) ? parsed : INITIAL_PLATFORM_POOL_SOL;
}

async function runAgent(input: {
  agent: LabAgent;
  question: string;
  concise: boolean;
  jsonOutput: boolean;
  estimatedTotal: number;
  estimatedSol: number;
  balanceBeforeSol: number;
}): Promise<{ text: string; jobId: string; actualCost: number; actualCostSol: number; balanceAfterSol: number }> {
  if (input.estimatedSol > input.balanceBeforeSol) {
    throw new Error("INSUFFICIENT_AGENT_BALANCE");
  }

  await new Promise((resolve) => setTimeout(resolve, 550));
  const prefix = input.jsonOutput ? "{\"response\":\"" : "";
  const suffix = input.jsonOutput ? "\"}" : "";
  const body = input.concise
    ? `As ${input.agent.name}, here is a concise recommendation: ${input.question.slice(0, 180)}...`
    : `As ${input.agent.name}, I'd approach this with a structured plan: clarify goals, define constraints, execute in phases, and measure outcomes. Your ask: ${input.question}`;

  return {
    text: `${prefix}${body}${suffix}`,
    jobId: `job_${Math.random().toString(36).slice(2, 10)}`,
    actualCost: input.estimatedTotal,
    actualCostSol: input.estimatedSol,
    balanceAfterSol: Math.max(input.balanceBeforeSol - input.estimatedSol, 0)
  };
}

type AgentStudioTabProps = {
  onPolygonStatusChange?: (connected: boolean) => void;
  onPlatformPoolChange?: (poolSol: number) => void;
};

export function AgentStudioTab({ onPolygonStatusChange, onPlatformPoolChange }: AgentStudioTabProps) {
  const [wallet, setWallet] = useState<WalletState>({ connected: false, address: null, chainId: null, isPolygon: false });
  const [usage, setUsage] = useState<Usage>({ dateKey: todayKey(), spentTodayUsd: 0, runsToday: 0 });
  const [selectedAgentId, setSelectedAgentId] = useState(agentsCatalog[0].id);
  const [search, setSearch] = useState("");
  const [model, setModel] = useState<LabModel>("gpt-mini");
  const [maxOutputTokens, setMaxOutputTokens] = useState(700);
  const [concise, setConcise] = useState(true);
  const [jsonOutput, setJsonOutput] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [promptModalAgent, setPromptModalAgent] = useState<LabAgent | null>(null);
  const [agentBalances, setAgentBalances] = useState<Record<string, number>>(defaultBalances);
  const [platformPoolSol, setPlatformPoolSol] = useState(INITIAL_PLATFORM_POOL_SOL);
  const [balanceDeductions, setBalanceDeductions] = useState<Record<string, number | undefined>>({});

  useEffect(() => {
    setAgentBalances(readStoredBalances());
    setPlatformPoolSol(readStoredPlatformPool());
  }, []);

  useEffect(() => {
    localStorage.setItem(BALANCES_STORAGE_KEY, JSON.stringify(agentBalances));
  }, [agentBalances]);

  useEffect(() => {
    localStorage.setItem(PLATFORM_POOL_STORAGE_KEY, platformPoolSol.toString());
    onPlatformPoolChange?.(platformPoolSol);
  }, [platformPoolSol, onPlatformPoolChange]);

  const effectiveAgents = useMemo(
    () => agentsCatalog.map((agent) => ({ ...agent, balanceSol: agentBalances[agent.id] ?? agent.balanceSol })),
    [agentBalances]
  );

  const selectedAgent = useMemo(
    () => effectiveAgents.find((agent) => agent.id === selectedAgentId) ?? effectiveAgents[0],
    [selectedAgentId, effectiveAgents]
  );

  const filteredAgents = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return effectiveAgents;
    }
    return effectiveAgents.filter((agent) => {
      const haystack = [agent.name, agent.title, agent.description, ...agent.tags].join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [search, effectiveAgents]);

  useEffect(() => {
    setModel(selectedAgent.defaultModel);
    setMaxOutputTokens(selectedAgent.defaultMaxOutputTokens);
  }, [selectedAgent]);

  useEffect(() => {
    if (wallet.connected && wallet.address) {
      setUsage(readUsage(wallet.address));
    }
  }, [wallet]);

  const inputTokens = estimateTokens(draft);
  const estimate = estimateCost({
    baseCostUsd: selectedAgent.baseCostUsd,
    pricing: pricingByModel[model],
    inputTokens,
    outputCapTokens: maxOutputTokens
  });
  const estimatedCostSol = usdToSol(estimate.totalCost, selectedAgent.solUsdRate);

  const remainingToday = Math.max(0, DAILY_CAP - usage.spentTodayUsd);
  const isSafe = estimate.totalCost <= PER_RUN_CAP;
  const hasBudgetRemaining = remainingToday >= estimate.totalCost;
  const hasAgentBalance = selectedAgent.balanceSol >= estimatedCostSol;
  const hasPlatformPool = platformPoolSol >= estimatedCostSol;

  const connectWallet = () => {
    const address = `0x${Math.random().toString(16).slice(2, 6)}${Math.random().toString(16).slice(2, 6)}${Math.random().toString(16).slice(2, 6)}ABCD`;
    const nextWallet = { connected: true, address, chainId: 137, isPolygon: true };
    setWallet(nextWallet);
    onPolygonStatusChange?.(nextWallet.isPolygon);
  };

  const disconnectWallet = () => {
    const nextWallet = { connected: false, address: null, chainId: null, isPolygon: false };
    setWallet(nextWallet);
    onPolygonStatusChange?.(false);
    setUsage({ dateKey: todayKey(), spentTodayUsd: 0, runsToday: 0 });
  };

  const askAgent = async () => {
    if (!wallet.connected || !wallet.address || !isSafe || !hasBudgetRemaining || !hasAgentBalance || !hasPlatformPool || !draft.trim()) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: draft,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMessage]);
    const question = draft;
    setDraft("");
    setIsRunning(true);

    const balanceBeforeSol = selectedAgent.balanceSol;

    try {
      const response = await runAgent({
        agent: selectedAgent,
        question,
        concise,
        jsonOutput,
        estimatedTotal: estimate.totalCost,
        estimatedSol: estimatedCostSol,
        balanceBeforeSol
      });

      setAgentBalances((prev) => ({
        ...prev,
        [selectedAgent.id]: response.balanceAfterSol
      }));
      setPlatformPoolSol((prev) => Math.max(prev - response.actualCostSol, 0));
      setBalanceDeductions((prev) => ({ ...prev, [selectedAgent.id]: response.actualCostSol }));
      window.setTimeout(() => {
        setBalanceDeductions((prev) => ({ ...prev, [selectedAgent.id]: undefined }));
      }, 1000);

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: response.text,
        createdAt: new Date().toISOString(),
        debug: {
          jobId: response.jobId,
          actualCost: response.actualCost,
          actualCostSol: response.actualCostSol,
          walletAddress: selectedAgent.walletAddress,
          balanceBeforeSol,
          balanceAfterSol: response.balanceAfterSol
        }
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const nextUsage: Usage = {
        dateKey: todayKey(),
        spentTodayUsd: usage.spentTodayUsd + response.actualCost,
        runsToday: usage.runsToday + 1
      };
      setUsage(nextUsage);
      writeUsage(wallet.address, nextUsage);
    } catch {
      const failedMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: "This agent does not have enough balance to process this request.",
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, failedMessage]);
    } finally {
      setIsRunning(false);
    }
  };

  const copyConversation = async () => {
    const text = messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join("\n\n");
    await navigator.clipboard.writeText(text);
  };

  const resetBalances = () => {
    setAgentBalances(defaultBalances);
    setPlatformPoolSol(INITIAL_PLATFORM_POOL_SOL);
    setBalanceDeductions({});
  };

  return (
    <section id="agent-studio-panel" role="tabpanel" aria-labelledby="agent-studio-tab" className="space-y-4 pt-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Wallet identity</p>
            {wallet.connected && wallet.address ? (
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)} · Chain {wallet.chainId} · Session Active
              </p>
            ) : (
              <p className="text-xs text-slate-500">Connect wallet for identity and rate limiting.</p>
            )}
          </div>
          {wallet.connected ? (
            <button onClick={disconnectWallet} className="focus-ring rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700">
              Disconnect
            </button>
          ) : (
            <button onClick={connectWallet} className="focus-ring rounded-lg bg-slate-900 px-3 py-2 text-sm text-white dark:bg-slate-100 dark:text-slate-900">
              Connect Wallet
            </button>
          )}
        </div>
        <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-4">
          <p>Spent Today: ${usage.spentTodayUsd.toFixed(4)}</p>
          <p>Runs Today: {usage.runsToday}</p>
          <p>Remaining Today: ${Math.max(0, DAILY_CAP - usage.spentTodayUsd).toFixed(4)}</p>
          <p>Platform Pool: {platformPoolSol.toFixed(6)} SOL</p>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full bg-slate-900 dark:bg-slate-100" style={{ width: `${Math.min(100, (usage.spentTodayUsd / DAILY_CAP) * 100)}%` }} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.35fr]">
        <AgentList
          agents={filteredAgents}
          selectedAgentId={selectedAgentId}
          search={search}
          agentBalances={agentBalances}
          balanceDeductions={balanceDeductions}
          onSearchChange={setSearch}
          onSelectAgent={setSelectedAgentId}
          onViewPrompt={setPromptModalAgent}
        />

        <ChatPanel
          agent={selectedAgent}
          model={model}
          maxOutputTokens={maxOutputTokens}
          concise={concise}
          jsonOutput={jsonOutput}
          draft={draft}
          inputTokens={inputTokens}
          estimate={estimate}
          estimatedCostSol={estimatedCostSol}
          remainingAfterRunSol={selectedAgent.balanceSol - estimatedCostSol}
          agentBalanceSol={selectedAgent.balanceSol}
          hasAgentBalance={hasAgentBalance}
          isSafe={isSafe}
          hasBudgetRemaining={hasBudgetRemaining}
          hasPlatformPool={hasPlatformPool}
          dailyRemainingUsd={remainingToday}
          messages={messages}
          wallet={wallet}
          isRunning={isRunning}
          onModelChange={setModel}
          onOutputCapChange={setMaxOutputTokens}
          onConciseChange={setConcise}
          onJsonOutputChange={setJsonOutput}
          onDraftChange={setDraft}
          onAsk={askAgent}
          onClear={() => setMessages([])}
          onCopyConversation={copyConversation}
        />
      </div>

      <div className="text-right">
        <button onClick={resetBalances} className="text-xs text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          Reset Balances
        </button>
      </div>

      <PromptModal
        open={Boolean(promptModalAgent)}
        onClose={() => setPromptModalAgent(null)}
        agentName={promptModalAgent?.name ?? "Agent"}
        prompt={promptModalAgent?.systemPrompt ?? ""}
      />
    </section>
  );
}
