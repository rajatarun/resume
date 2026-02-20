"use client";

import { useState } from "react";

type ChatResult = { answer: string; citations: Array<{ sourceId: string; title: string }> };

export function RecruiterConsole() {
  const [message, setMessage] = useState("What leadership examples should I discuss?");
  const [chat, setChat] = useState<ChatResult | null>(null);
  const [jobDescription, setJobDescription] = useState("Paste a job description here...");
  const [match, setMatch] = useState<Record<string, unknown> | null>(null);

  async function askChat() {
    const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ message, mode: "qa" }) });
    setChat(await res.json());
  }

  async function runMatch() {
    const res = await fetch("/api/match", { method: "POST", body: JSON.stringify({ jobDescription, mode: "match" }) });
    setMatch(await res.json());
  }

  return (
    <section className="grid gap-6 md:grid-cols-2">
      <div className="prose-card space-y-3">
        <h2 className="text-xl font-semibold">Recruiter Chat</h2>
        <p className="text-sm text-slate-500">Grounded in resume only. If not found, it returns “Not in resume.”</p>
        <textarea className="h-28 w-full rounded-lg border p-3" value={message} onChange={(e) => setMessage(e.target.value)} />
        <button className="rounded-lg bg-brand-500 px-4 py-2 text-white" onClick={askChat}>Send</button>
        {chat && (
          <div className="rounded-lg bg-slate-100 p-3 text-sm">
            <p>{chat.answer}</p>
            <ul className="mt-2 list-disc pl-5">
              {chat.citations.map((c) => <li key={c.sourceId}>{c.title}</li>)}
            </ul>
          </div>
        )}
      </div>
      <div className="prose-card space-y-3">
        <h2 className="text-xl font-semibold">JD Match</h2>
        <p className="text-sm text-slate-500">Pasted JDs are processed in-memory and not stored.</p>
        <textarea className="h-48 w-full rounded-lg border p-3" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
        <button className="rounded-lg bg-brand-500 px-4 py-2 text-white" onClick={runMatch}>Analyze JD</button>
        {match && <pre className="max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(match, null, 2)}</pre>}
      </div>
    </section>
  );
}
