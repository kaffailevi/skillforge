"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { ChatMessage } from "@/lib/chat-types";
import { conversationStore, saveMessages, type Conversation } from "@/lib/conversations";
import { useLocalStore } from "@/lib/local-store";
import { modelChoiceStore } from "@/lib/model-choice-store";
import { profileStore } from "@/lib/profile-store";
import { ModelChoice, PROVIDERS, resolveChoice, type ProviderId } from "@/lib/providers";
import { Markdown } from "@/components/markdown";

const SUGGESTIONS = [
  "What should I learn next?",
  "How do I get better at React?",
  "Show me what your answers can format",
];

const transport = new DefaultChatTransport({ api: "/api/chat" });

// The browser stores plain text messages; useChat works with UIMessages made of parts.
function toUIMessage(message: ChatMessage): UIMessage {
  return { id: message.id, role: message.role, parts: [{ type: "text", text: message.content }] };
}

function toChatMessage(message: UIMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role === "user" ? "user" : "assistant",
    content: message.parts.map((part) => (part.type === "text" ? part.text : "")).join(""),
  };
}

export function Chat({ available }: { available: ProviderId[] }) {
  const state = useLocalStore(conversationStore);
  const savedChoice = useLocalStore(modelChoiceStore);
  if (!state || !savedChoice) return <p className="p-6 text-sm text-muted">Loading…</p>;

  const conversation = state.conversations.find((item) => item.id === state.activeId) ?? null;
  return (
    <ChatSession
      key={state.activeId}
      id={state.activeId}
      conversation={conversation}
      choice={resolveChoice(savedChoice, available)}
      available={available}
    />
  );
}

type SessionProps = {
  id: string;
  conversation: Conversation | null;
  choice: ModelChoice;
  available: ProviderId[];
};

function ChatSession({ id, conversation, choice, available }: SessionProps) {
  const [input, setInput] = useState("");
  const [initialMessages] = useState(() => conversation?.messages.map(toUIMessage) ?? []);
  const { messages, sendMessage, regenerate, stop, status, error } = useChat({ id, messages: initialMessages, transport });
  const busy = status === "submitted" || status === "streaming";
  const endRef = useRef<HTMLDivElement>(null);

  // Save whenever no answer is mid-stream: after sending, after the answer, after Stop or an error.
  useEffect(() => {
    if (status === "streaming") return;
    const toSave = messages.map(toChatMessage).filter((message) => message.role === "user" || message.content !== "");
    saveMessages(id, toSave);
  }, [id, messages, status]);

  // Keep the newest words in view while an answer streams in.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  // Read at send time, so a profile or model change counts from the next message.
  function requestBody() {
    return { body: { profile: profileStore.get(), model: choice } };
  }

  function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setInput("");
    void sendMessage({ text: content }, requestBody());
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

  const visible = messages.filter((message) => message.role !== "system").map(toChatMessage);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-border px-4 py-2 md:px-6">
        <h1 className="min-w-0 flex-1 truncate font-medium">{conversation?.title ?? "New chat"}</h1>
        <ModelPicker choice={choice} available={available} disabled={busy} />
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-4 pt-10 text-center">
              <h2 className="text-xl font-semibold">What do you want to learn next?</h2>
              <p className="text-sm text-muted">Ask your mentor anything about your tech career.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={busy}
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
              {visible.map((message) =>
                message.role === "user" ? (
                  <li
                    key={message.id}
                    className="max-w-[85%] self-end rounded-2xl bg-accent px-4 py-2 whitespace-pre-wrap text-accent-foreground"
                  >
                    {message.content}
                  </li>
                ) : message.content ? (
                  <li key={message.id} className="max-w-[85%] self-start">
                    <Markdown>{message.content}</Markdown>
                  </li>
                ) : null,
              )}
              {busy && (visible.at(-1)?.role === "user" || visible.at(-1)?.content === "") && (
                <li className="animate-pulse self-start text-muted">Thinking…</li>
              )}
            </ol>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 p-4">
          {error && !busy && (
            <div role="alert" className="flex items-center gap-3 rounded-lg border border-danger/40 px-3 py-2 text-sm">
              <span className="flex-1">{error.message || "Something went wrong."}</span>
              <button type="button" onClick={() => void regenerate(requestBody())} className="font-medium underline">
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
            {busy ? (
              <button type="button" onClick={() => void stop()} className="rounded-xl border border-border px-4 font-medium">
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
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

type PickerProps = { choice: ModelChoice; available: ProviderId[]; disabled: boolean };

// Providers without an API key on the server are listed but cannot be picked.
function ModelPicker({ choice, available, disabled }: PickerProps) {
  function onChange(value: string) {
    const [provider, model] = value.split(":");
    const parsed = ModelChoice.safeParse({ provider, model });
    if (parsed.success) modelChoiceStore.set(parsed.data);
  }

  return (
    <select
      aria-label="Model"
      value={`${choice.provider}:${choice.model}`}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="max-w-[45%] rounded-lg border border-border bg-background px-2 py-1 text-sm disabled:opacity-60"
    >
      {PROVIDERS.map((provider) => {
        const ready = available.includes(provider.id);
        return (
          <optgroup key={provider.id} label={ready ? provider.label : `${provider.label} (no API key)`}>
            {provider.models.map((model) => (
              <option key={model.id} value={`${provider.id}:${model.id}`} disabled={!ready}>
                {model.label}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}
