"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type KeyboardEvent } from "react";
import type { ChatMessage } from "@/lib/chat-types";
import { readEventStream } from "@/lib/read-event-stream";

// Step 2: the whole conversation lives in localStorage under this key.
const STORAGE_KEY = "skillforge.messages";

function loadMessages(): ChatMessage[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

const noSubscription = () => () => {};

// localStorage exists only in the browser. The server renders "Loading…", the browser renders the chat.
export function Chat() {
  const inBrowser = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  if (!inBrowser) return <p className="p-6 text-sm text-foreground/60">Loading…</p>;
  return <ChatSession />;
}

type Status = "idle" | "streaming" | "error";

function ChatSession() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Save once an answer is complete, not on every streamed word.
  useEffect(() => {
    if (status !== "streaming") localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages, status]);

  async function streamAnswer(history: ChatMessage[]) {
    const answerId = crypto.randomUUID();
    setMessages([...history, { id: answerId, role: "assistant", content: "" }]);
    setStatus("streaming");
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw new Error(`The mentor is not available (HTTP ${response.status}).`);

      for await (const event of readEventStream(response.body)) {
        if (event.type === "delta") {
          setMessages((current) =>
            current.map((message) =>
              message.id === answerId ? { ...message, content: message.content + event.text } : message,
            ),
          );
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }
      setStatus("idle");
    } catch (caught) {
      if (controller.signal.aborted) {
        setStatus("idle"); // Stopped on purpose: keep what arrived so far.
        return;
      }
      setMessages((current) => current.filter((message) => !(message.id === answerId && message.content === "")));
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
      setStatus("error");
    } finally {
      abortRef.current = null;
    }
  }

  function send(event?: FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || status === "streaming") return;
    setInput("");
    void streamAnswer([...messages, { id: crypto.randomUUID(), role: "user", content: text }]);
  }

  function retry() {
    const history = messages.at(-1)?.role === "assistant" ? messages.slice(0, -1) : messages;
    void streamAnswer(history);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) send(event);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4">
      <ol className="flex flex-1 flex-col gap-3">
        {messages.length === 0 && (
          <li className="text-sm text-foreground/60">Ask your mentor anything about your tech career.</li>
        )}
        {messages.map((message) => (
          <li
            key={message.id}
            className={
              message.role === "user"
                ? "self-end rounded-lg bg-foreground px-3 py-2 whitespace-pre-wrap text-background"
                : "self-start rounded-lg border border-foreground/15 px-3 py-2 whitespace-pre-wrap"
            }
          >
            {message.content || "…"}
          </li>
        ))}
      </ol>

      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-lg border border-red-500/40 px-3 py-2 text-sm">
          <span>{error}</span>
          <button type="button" onClick={retry} className="underline">
            Retry
          </button>
        </div>
      )}

      <form onSubmit={send} className="flex gap-2">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          placeholder="Message your mentor (Enter to send, Shift+Enter for a new line)"
          className="flex-1 resize-none rounded-lg border border-foreground/20 bg-transparent px-3 py-2"
        />
        {status === "streaming" ? (
          <button type="button" onClick={() => abortRef.current?.abort()} className="rounded-lg border px-4">
            Stop
          </button>
        ) : (
          <button type="submit" disabled={!input.trim()} className="rounded-lg bg-foreground px-4 text-background disabled:opacity-40">
            Send
          </button>
        )}
      </form>

      {messages.length > 0 && status !== "streaming" && (
        <button type="button" onClick={() => setMessages([])} className="self-start text-sm text-foreground/60 underline">
          Clear conversation
        </button>
      )}
    </div>
  );
}
