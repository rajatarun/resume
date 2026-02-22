"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { streamChatQuestion } from "@/lib/api";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: unknown[];
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSubmitting]);

  const canSubmit = useMemo(() => question.trim().length > 0 && !isSubmitting, [question, isSubmitting]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isSubmitting) {
      return;
    }

    setError(null);
    setQuestion("");

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmedQuestion
    };

    const assistantMessageId = createId();
    const assistantPlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: ""
    };

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setIsSubmitting(true);

    try {
      const response = await streamChatQuestion(
        { question: trimmedQuestion },
        {
          onToken: (token) => {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantMessageId
                  ? {
                      ...message,
                      content: `${message.content}${token}`
                    }
                  : message
              )
            );
          }
        }
      );

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                content: message.content || response.answer,
                citations: response.citations
              }
            : message
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong while sending your message.";
      setError(message);
      setMessages((prev) => prev.filter((chatMessage) => chatMessage.id !== assistantMessageId));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-3xl font-semibold tracking-tight">AI Assistant</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Ask questions and get grounded answers from the RAG knowledge base.</p>
      </header>

      <section className="flex min-h-[60vh] flex-col rounded-2xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 p-4 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950 sm:p-6">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              Start the conversation by asking a question.
            </div>
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                className={`max-w-[90%] rounded-2xl p-4 text-sm shadow-sm sm:max-w-[80%] ${
                  message.role === "user"
                    ? "ml-auto bg-blue-600 text-white"
                    : "border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{message.content || " "}</p>
                {message.role === "assistant" && message.citations && message.citations.length > 0 ? (
                  <details className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                    <summary className="cursor-pointer font-medium">Citations ({message.citations.length})</summary>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words">{JSON.stringify(message.citations, null, 2)}</pre>
                  </details>
                ) : null}
              </article>
            ))
          )}

          {isSubmitting ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" aria-hidden />
              <span>Assistant is thinking…</span>
            </div>
          ) : null}

          <div ref={endRef} />
        </div>

        <form onSubmit={handleSubmit} className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <label htmlFor="question" className="sr-only">
            Ask a question
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <textarea
              id="question"
              rows={3}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              disabled={isSubmitting}
              placeholder="Ask about projects, experience, or technical depth..."
              className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-blue-900"
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className="h-fit rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
          {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        </form>
      </section>
    </div>
  );
}
