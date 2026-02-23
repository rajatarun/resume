"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { streamChatQuestion } from "@/lib/api";
import { buildRecruiterModeQuestion, getRecruiterModeConfig, type RecruiterMode } from "@/lib/recruiter";
import { Button } from "@/components/Button";
import { Textarea } from "@/components/Input";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: unknown[];
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createOpeningMessage = (mode: RecruiterMode): ChatMessage => ({
  id: createId(),
  role: "assistant",
  content: getRecruiterModeConfig(mode).openingMessage
});

export function ChatPane({ mode }: { mode: RecruiterMode }) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [createOpeningMessage(mode)]);
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages([createOpeningMessage(mode)]);
    setQuestion("");
    setError(null);
  }, [mode]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSubmitting]);

  const canSubmit = useMemo(() => question.trim().length > 0 && !isSubmitting, [question, isSubmitting]);
  const config = getRecruiterModeConfig(mode);

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
        { question: buildRecruiterModeQuestion(mode, trimmedQuestion) },
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
    <section className="rounded-2xl border border-slate-200 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="text-lg font-semibold">{mode}</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Mode-aware chat is active. Responses are scoped to the selected tab context.</p>

      <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {messages.map((message) => (
          <article
            key={message.id}
            className={`max-w-[90%] rounded-2xl p-3 text-sm shadow-sm ${
              message.role === "user"
                ? "ml-auto bg-sky-600 text-white"
                : "border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            }`}
          >
            <p className="whitespace-pre-wrap leading-relaxed">{message.content || " "}</p>
            {message.role === "assistant" && message.citations && message.citations.length > 0 ? (
              <details className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <summary className="cursor-pointer font-medium">Citations ({message.citations.length})</summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words">{JSON.stringify(message.citations, null, 2)}</pre>
              </details>
            ) : null}
          </article>
        ))}

        {isSubmitting ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" aria-hidden />
            <span>Assistant is thinking…</span>
          </div>
        ) : null}

        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
        <label htmlFor="recruiter-question" className="sr-only">
          Ask a question in {mode}
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Textarea
            id="recruiter-question"
            rows={3}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            disabled={isSubmitting}
            placeholder={config.placeholder}
            className="min-h-[96px] resize-none"
          />
          <Button type="submit" disabled={!canSubmit} className="h-fit">
            Send
          </Button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      </form>
    </section>
  );
}

export type { RecruiterMode };
