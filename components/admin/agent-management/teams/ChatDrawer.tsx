'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '@/components/admin/agent-management/shared/apiFetch';
import { useFocusTrap } from '@/hooks/useFocusTrap';

type Message = {
  role: 'user' | 'agent';
  text: string;
  ts: Date;
  isError?: boolean;
};

type ConverseResponse = {
  agent_id: string;
  alias_id: string;
  session_id: string;
  response: string;
};

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ChatDrawer({
  open,
  agentId,
  aliasId,
  agentName,
  onClose,
}: {
  open: boolean;
  agentId: string;
  aliasId: string;
  agentName: string;
  onClose: () => void;
}) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useFocusTrap(drawerRef, open);

  useEffect(() => {
    if (!open) return;
    setSessionId(createSessionId());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading, open]);

  const sendDisabled = useMemo(() => loading || !input.trim(), [loading, input]);

  const appendMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleSend = async () => {
    const message = input.trim();
    if (!message || loading) return;

    setInput('');
    appendMessage({ role: 'user', text: message, ts: new Date() });
    setLoading(true);

    try {
      const data = await apiFetch<ConverseResponse>('/agent/converse', {
        method: 'POST',
        body: {
          agent_id: agentId,
          alias_id: aliasId,
          session_id: sessionId,
          message,
        },
      });
      appendMessage({ role: 'agent', text: data.response, ts: new Date() });
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Unable to send message';
      appendMessage({ role: 'agent', text: messageText, ts: new Date(), isError: true });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-drawer-title"
    >
      <div
        ref={drawerRef}
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-xl dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 id="chat-drawer-title" className="text-lg font-semibold">
              Chat with {agentName}
            </h3>
            <p className="text-xs text-slate-500">Session: {sessionId}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="focus-ring rounded border px-3 py-1 text-sm"
              onClick={() => {
                setMessages([]);
                setSessionId(createSessionId());
                setInput('');
              }}
            >
              New conversation
            </button>
            <button
              type="button"
              aria-label="Close chat"
              className="focus-ring rounded border px-3 py-1 text-sm"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="text-sm text-slate-500">Start a conversation with this agent.</p>
          )}
          {messages.map((msg) => (
            <div
              key={`${msg.role}-${msg.ts.toISOString()}-${msg.text}`}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-slate-900 text-white' : msg.isError ? 'border border-red-300 bg-red-50 text-red-700' : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'}`}
              >
                <div>{msg.text}</div>
                <div className="mt-1 text-[10px] opacity-70">{msg.ts.toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded bg-slate-100 px-3 py-2 dark:bg-slate-800">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="sticky bottom-0 border-t bg-white p-3 dark:bg-slate-900">
          <div className="flex items-end gap-2">
            <textarea
              className="focus-ring min-h-[44px] flex-1 resize-y rounded border px-3 py-2 text-sm"
              placeholder="Type a message..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
            />
            <button
              type="button"
              className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={sendDisabled}
              onClick={() => {
                void handleSend();
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
