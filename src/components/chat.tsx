"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { ChatMessage } from "@/lib/chat-types";
import {
  conversationStore,
  createConversation,
  updateMessages,
  type Conversation,
} from "@/lib/conversations";
import { useLocalStore } from "@/lib/local-store";
import { profileStore } from "@/lib/profile-store";
import { readEventStream } from "@/lib/read-event-stream";
import { Markdown } from "@/components/markdown";

const SUGGESTIONS = [
  "What should I learn next?",
  "How do I get better at React?",
  "Show me what your answers can format",
];

export function Chat() {
  const state = useLocalStore(conversationStore);
  if (!state) return <p className="p-6 text-sm text-muted">Loading…</p>;

  const conversation = state.conversations.find((item) => item.id === state.activeId) ?? null;
  return <ChatSession conversation={conversation} />;
}

type ChatError = { conversationId: string; message: string };

function ChatSession({ conversation }: { conversation: Conversation | null }) {
  const [input, setInput] = useState("");
  // One answer streams at a time. It keeps writing into its own conversation even if another one is opened.
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [error, setError] = useState<ChatError | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const activeId = conversation?.id ?? null;
  const messages = conversation?.messages ?? [];
  const streamingHere = streamingId !== null && streamingId === activeId;
  const visibleError = error && error.conversationId === activeId ? error.message : null;

  // Keep the newest words in view while an answer streams in.
  const lastLength = messages.at(-1)?.content.length ?? 0;
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [activeId, messages.length, lastLength]);

  async function streamAnswer(conversationId: string, history: ChatMessage[]) {
    const answerId = crypto.randomUUID();
    updateMessages(conversationId, () => [...history, { id: answerId, role: "assistant", content: "" }]);
    setStreamingId(conversationId);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          profile: profileStore.get(), // read at send time, so a just-saved change counts
        }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw new Error(`The mentor is not available (HTTP ${response.status}).`);

      for await (const event of readEventStream(response.body)) {
        if (event.type === "delta") {
          updateMessages(conversationId, (current) =>
            current.map((message) =>
              message.id === answerId ? { ...message, content: message.content + event.text } : message,
            ),
          );
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }
    } catch (caught) {
      if (controller.signal.aborted) return; // Stopped on purpose: keep what arrived so far.
      updateMessages(conversationId, (current) =>
        current.filter((message) => !(message.id === answerId && message.content === "")),
      );
      setError({ conversationId, message: caught instanceof Error ? caught.message : "Something went wrong." });
    } finally {
      abortRef.current = null;
      setStreamingId(null);
    }
  }

  function send(text: string) {
    const content = text.trim();
    if (!content || streamingId !== null) return;
    setInput("");

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    const conversationId = activeId ?? createConversation(userMessage);
    void streamAnswer(conversationId, [...messages, userMessage]);
  }

  function retry() {
    if (!activeId) return;
    const history = messages.at(-1)?.role === "assistant" ? messages.slice(0, -1) : messages;
    void streamAnswer(activeId, history);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    send(input);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send(input);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-border px-4 py-3 md:px-6">
        <h1 className="truncate font-medium">{conversation?.title ?? "New chat"}</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-4 pt-10 text-center">
              <h2 className="text-xl font-semibold">What do you want to learn next?</h2>
              <p className="text-sm text-muted">Ask your mentor anything about your tech career.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={streamingId !== null}
                    onClick={() => send(suggestion)}
                    className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-surface disabled:opacity-40"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ol className="flex flex-col gap-4">
              {messages.map((message) =>
                message.role === "user" ? (
                  <li
                    key={message.id}
                    className="max-w-[85%] self-end rounded-2xl bg-accent px-4 py-2 whitespace-pre-wrap text-accent-foreground"
                  >
                    {message.content}
                  </li>
                ) : (
                  <li key={message.id} className="max-w-[85%] self-start">
                    {message.content ? (
                      <Markdown>{message.content}</Markdown>
                    ) : (
                      <span className="animate-pulse text-muted">Thinking…</span>
                    )}
                  </li>
                ),
              )}
            </ol>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 p-4">
          {visibleError && (
            <div role="alert" className="flex items-center gap-3 rounded-lg border border-danger/40 px-3 py-2 text-sm">
              <span className="flex-1">{visibleError}</span>
              <button type="button" onClick={retry} className="font-medium underline">
                Retry
              </button>
            </div>
          )}

          <form onSubmit={onSubmit} className="flex gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              aria-label="Message"
              placeholder="Message your mentor (Enter to send, Shift+Enter for a new line)"
              className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 focus:border-accent focus:outline-none"
            />
            {streamingHere ? (
              <button
                type="button"
                onClick={() => abortRef.current?.abort()}
                className="rounded-xl border border-border px-4 font-medium"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || streamingId !== null}
                className="rounded-xl bg-accent px-4 font-medium text-accent-foreground disabled:opacity-40"
              >
                Send
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
