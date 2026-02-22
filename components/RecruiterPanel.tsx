"use client";

import { useMemo, useState } from "react";
import { streamChatQuestion } from "@/lib/api";
import { buildResumeContext, type ResumeData } from "@/lib/resume";

type Message = { id: string; role: "user" | "assistant"; text: string };

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function RecruiterPanel({ data }: { data: ResumeData }) {
  const [messages, setMessages] = useState<Message[]>([{ id: createId(), role: "assistant", text: "Hi! Ask me anything about Tarun Raja's background." }]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [jd, setJd] = useState("");
  const [report, setReport] = useState<{ fit: string; strengths: string[]; gaps: string[] } | null>(null);

  const contextPreview = useMemo(() => buildResumeContext(data), [data]);

  async function sendMessage() {
    const trimmedInput = input.trim();

    if (!trimmedInput || isSending) return;

    const assistantMessageId = createId();
    const userMessage: Message = { id: createId(), role: "user", text: trimmedInput };
    setMessages((prev) => [...prev, userMessage, { id: assistantMessageId, role: "assistant", text: "" }]);
    setChatError(null);
    setInput("");
    setIsSending(true);

    try {
      const response = await streamChatQuestion(
        { question: trimmedInput },
        {
          onToken: (token) => {
            setMessages((prev) =>
              prev.map((message, index) =>
                message.id === assistantMessageId
                  ? {
                      ...message,
                      text: `${message.text}${token}`
                    }
                  : message
              )
            );
          }
        }
      );

      setMessages((prev) =>
        prev.map((message, index) =>
          message.id === assistantMessageId
            ? {
                ...message,
                text: message.text || response.answer
              }
            : message
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong while contacting the chat service.";
      setChatError(errorMessage);
      setMessages((prev) => prev.filter((message) => message.id !== assistantMessageId));
    } finally {
      setIsSending(false);
    }
  }

  function analyzeJd() {
    const jdText = jd.toLowerCase();
    const strengths = data.skills.groups
      .flatMap((group) => group.items)
      .filter((item) => jdText.includes(item.toLowerCase()))
      .slice(0, 6);

    setReport({
      fit: strengths.length > 3 ? "High" : strengths.length > 1 ? "Moderate" : "Exploratory",
      strengths,
      gaps: ["Domain-specific tool depth not explicitly listed in resume", "Role-specific requirements should be validated in interview"]
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Recruiter Chat</h2>
        <div className="mt-4 h-72 space-y-3 overflow-auto rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900">
          {messages.map((message) => (
            <div key={message.id} className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${message.role === "user" ? "ml-auto bg-blue-600 text-white" : "bg-white dark:bg-zinc-800"}`}>
              {message.text}
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about leadership, architecture, or skills" className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700" />
          <button onClick={sendMessage} disabled={isSending || !input.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50">Send</button>
        </div>
        {isSending ? <p className="mt-2 text-xs text-zinc-500">Assistant is thinking…</p> : null}
        {chatError ? <p className="mt-2 text-xs text-red-600 dark:text-red-400">{chatError}</p> : null}
      </section>

      <section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">JD Match</h2>
        <textarea value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste a job description" className="mt-4 h-40 w-full rounded-lg border border-zinc-300 bg-transparent p-3 text-sm dark:border-zinc-700" />
        <button onClick={analyzeJd} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">Analyze</button>
        {report && (
          <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
            <p><span className="font-semibold">Fit:</span> {report.fit}</p>
            <p className="mt-2 font-semibold">Matched strengths</p>
            <ul className="list-disc pl-5">
              {report.strengths.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        )}
        <details className="mt-4 rounded-xl border border-zinc-300 p-3 text-xs dark:border-zinc-700">
          <summary className="cursor-pointer font-semibold">Resume Context Preview</summary>
          <pre className="mt-2 whitespace-pre-wrap">{contextPreview}</pre>
        </details>
      </section>
    </div>
  );
}
