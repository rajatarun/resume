"use client";

import { useEffect, useRef, useState } from "react";
import {
  executeConversational,
  ApiError,
  ChatMessage,
} from "@/lib/deviceweave";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex max-w-[75%] flex-col gap-1">
        <div className="flex items-center gap-1 rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-slate-400 animate-bounce dark:bg-slate-500"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="flex max-w-[75%] flex-col gap-1">
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
          }`}
        >
          {message.text}
        </div>
        <span
          className={`text-xs text-slate-400 dark:text-slate-500 ${
            isUser ? "text-right" : "text-left"
          }`}
        >
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

// ─── HomeTab ──────────────────────────────────────────────────────────────────

export function HomeTab() {
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = {
      role: "user",
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setSending(true);
    setSendError(null);

    try {
      const res = await executeConversational({ session_id: sessionId, command: text });
      const assistantMsg: ChatMessage = {
        role: "assistant",
        text: res.response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const message =
        err instanceof ApiError && err.status !== 0 ? err.message : "Network error";
      setSendError(message);
    } finally {
      setSending(false);
    }
  };

  const handleNewConversation = () => {
    setSessionId(crypto.randomUUID());
    setMessages([]);
    setSendError(null);
    setInputText("");
  };

  return (
    <div className="flex h-[calc(100vh-240px)] min-h-[480px] flex-col">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">Home</h2>
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          onClick={handleNewConversation}
        >
          New conversation
        </button>
      </div>

      {/* ── Message list ── */}
      <div className="min-h-0 flex-1 overflow-y-auto space-y-4 py-2 pr-1">
        {messages.length === 0 && !sending && (
          <div className="flex h-full items-center justify-center">
            <p className="max-w-xs px-4 text-center text-sm text-slate-400 dark:text-slate-600">
              Ask me anything — I can control your devices and run scenes.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {sending && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ── Error banner ── */}
      {sendError && (
        <div className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <span className="font-medium">⚠ Could not send message.</span>{" "}
          {sendError}
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="mt-2 flex items-center gap-2 border-t pt-3">
        <input
          ref={inputRef}
          type="text"
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:focus:border-slate-400 dark:focus:ring-slate-700"
          placeholder="Type a command…"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
        />
        <button
          type="button"
          className="flex shrink-0 items-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          onClick={() => void handleSend()}
          disabled={sending || !inputText.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
