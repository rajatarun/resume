"use client";

import { useMemo, useState } from "react";
import { buildResumeContext, type ResumeData } from "@/lib/resume";

type Message = { role: "user" | "assistant"; text: string };

export function RecruiterPanel({ data }: { data: ResumeData }) {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: "Hi! Ask me anything about Tarun Raja's background." }]);
  const [input, setInput] = useState("");
  const [jd, setJd] = useState("");
  const [report, setReport] = useState<{ fit: string; strengths: string[]; gaps: string[] } | null>(null);

  const contextPreview = useMemo(() => buildResumeContext(data), [data]);

  function sendMessage() {
    if (!input.trim()) return;
    const userMessage: Message = { role: "user", text: input.trim() };
    const assistantMessage: Message = {
      role: "assistant",
      text: `Mock response: Based on resume data, key strength areas include ${data.skills.groups[0].items[0]}, leadership at ${data.experience[0].company}, and AI enablement.`
    };
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
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
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${message.role === "user" ? "ml-auto bg-blue-600 text-white" : "bg-white dark:bg-zinc-800"}`}>
              {message.text}
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about leadership, architecture, or skills" className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700" />
          <button onClick={sendMessage} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">Send</button>
        </div>
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
