"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  isToolUIPart,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type UIMessage,
} from "ai";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { apiKeyStore, keyHeaders } from "@/lib/api-key-store";
import type { ChatMessage } from "@/lib/chat-types";
import { conversationStore, saveMessages, type Conversation } from "@/lib/conversations";
import { useLocalStore } from "@/lib/local-store";
import { modelChoiceStore } from "@/lib/model-choice-store";
import { profileStore } from "@/lib/profile-store";
import { ModelChoice, PROVIDERS, resolveChoice, type ProviderId } from "@/lib/providers";
import { BrandMark } from "@/components/brand";
import { ArrowUpIcon, StopIcon } from "@/components/icons";
import { Markdown } from "@/components/markdown";
import { ToolPart } from "@/components/tool-part";

const SUGGESTIONS = [
  "What should I learn next?",
  "How do I get better at React?",
  "Are there any React workshops in Cluj?",
];

// The browser stores plain text messages; useChat works with UIMessages made of parts.
function toUIMessage(message: ChatMessage): UIMessage {
  return {
    id: message.id,
    role: message.role,
    parts: [{ type: "text", text: message.content }],
  };
}

// An answer is worth showing once it has words or a tool call (a tool card).
function hasVisibleContent(message: UIMessage): boolean {
  return message.parts.some((part) => (part.type === "text" && part.text !== "") || isToolUIPart(part));
}

// Tool calls are not saved: the browser keeps only the words of each message.
function toChatMessage(message: UIMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role === "user" ? "user" : "assistant",
    content: message.parts.map((part) => (part.type === "text" ? part.text : "")).join(""),
  };
}

// serverProviders: providers usable without the learner's key (the mock, or a key set on the server).
export function Chat({ serverProviders }: { serverProviders: ProviderId[] }) {
  const state = useLocalStore(conversationStore);
  const savedChoice = useLocalStore(modelChoiceStore);
  const keys = useLocalStore(apiKeyStore);
  if (!state || !savedChoice || !keys) return <p className="p-6 text-sm text-muted">Loading…</p>;

  const available = availableProviders(serverProviders, keys.google);
  const conversation = state.conversations.find((item) => item.id === state.activeId) ?? null;
  return (
    <ChatSession
      key={state.activeId}
      id={state.activeId}
      conversation={conversation}
      choice={resolveChoice(savedChoice, available)}
      available={available}
      serverProviders={serverProviders}
    />
  );
}

function availableProviders(serverProviders: ProviderId[], googleKey: string): ProviderId[] {
  return googleKey && !serverProviders.includes("google") ? [...serverProviders, "google"] : serverProviders;
}

type SessionProps = {
  id: string;
  conversation: Conversation | null;
  choice: ModelChoice;
  available: ProviderId[];
  serverProviders: ProviderId[];
};

function ChatSession({ id, conversation, choice, available, serverProviders }: SessionProps) {
  const [input, setInput] = useState("");
  const [initialMessages] = useState(() => conversation?.messages.map(toUIMessage) ?? []);

  // Profile, model and key are read from the browser's stores at send time (also for the automatic
  // request after Approve/Reject), so a change counts from the next message.
  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          profile: profileStore.get(),
          model: resolveChoice(modelChoiceStore.get(), availableProviders(serverProviders, apiKeyStore.get().google)),
        }),
        headers: () => keyHeaders(),
      }),
  );

  const { messages, sendMessage, regenerate, stop, status, error, addToolApprovalResponse } = useChat({
    id,
    messages: initialMessages,
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });
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

  function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setInput("");
    void sendMessage({ text: content });
  }

  function respond(approvalId: string, approved: boolean) {
    void addToolApprovalResponse({ id: approvalId, approved });
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

  const visible = messages.filter((message) => message.role !== "system");
  const last = visible.at(-1);
  const waitingForWords = busy && (last?.role === "user" || (last !== undefined && !hasVisibleContent(last)));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="page-header">
        <h1 className="page-title">{conversation?.title ?? "New chat"}</h1>
        <ModelPicker choice={choice} available={available} disabled={busy} />
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 pt-8 text-center">
              <BrandMark size="lg" />
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">What do you want to learn next?</h2>
              <p className="text-sm text-muted">Ask your mentor anything about your tech career, or find a workshop.</p>
              {!available.includes("google") && (
                <p className="mt-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm">
                  You are talking to the <strong>mock mentor</strong>. To use Gemini, add your own API key in{" "}
                  <Link href="/settings" className="font-medium text-accent underline underline-offset-2">
                    Settings
                  </Link>
                  .
                </p>
              )}
              <div className="mt-6 grid w-full gap-3 sm:grid-cols-3">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={busy}
                    onClick={() => send(suggestion)}
                    className="card px-4 py-3 text-left text-sm transition-colors hover:border-accent/60 hover:bg-accent-soft disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ol className="flex flex-col gap-6">
              {visible.map((message) =>
                message.role === "user" ? (
                  <li
                    key={message.id}
                    className="max-w-[85%] self-end rounded-2xl rounded-br-md border border-border bg-surface px-4 py-2.5 whitespace-pre-wrap"
                  >
                    {toChatMessage(message).content}
                  </li>
                ) : hasVisibleContent(message) ? (
                  <li key={message.id} className="flex max-w-[85%] flex-col gap-3 self-start leading-relaxed">
                    {message.parts.map((part, index) =>
                      part.type === "text" ? (
                        part.text ? (
                          <Markdown key={index}>{part.text}</Markdown>
                        ) : null
                      ) : isToolUIPart(part) ? (
                        <ToolPart key={part.toolCallId} part={part} onRespond={respond} />
                      ) : null,
                    )}
                  </li>
                ) : null,
              )}
              {waitingForWords && (
                <li className="flex items-center gap-2 self-start text-sm text-muted" role="status">
                  <span className="flex gap-1" aria-hidden="true">
                    <span className="size-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-accent" />
                  </span>
                  Thinking…
                </li>
              )}
            </ol>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="px-4 pt-2 pb-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          {error && !busy && (
            <div
              role="alert"
              className="flex items-center gap-3 rounded-lg border border-danger/40 bg-danger/5 px-3 py-2 text-sm"
            >
              <span className="flex-1">{error.message || "Something went wrong."}</span>
              <button type="button" onClick={() => void regenerate()} className="btn btn-secondary py-1">
                Retry
              </button>
            </div>
          )}

          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-border-strong bg-card shadow-sm transition-shadow focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20"
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              aria-label="Message"
              placeholder="Message your mentor…"
              className="block w-full resize-none bg-transparent px-4 pt-3 placeholder:text-muted/70 focus:outline-none focus-visible:outline-none"
            />
            <div className="flex items-center gap-3 px-3 pb-3">
              <p className="flex-1 pl-1 text-xs text-muted max-sm:hidden">
                <kbd className="font-sans font-medium">Enter</kbd> to send ·{" "}
                <kbd className="font-sans font-medium">Shift + Enter</kbd> for a new line
              </p>
              {busy ? (
                <button
                  type="button"
                  onClick={() => void stop()}
                  aria-label="Stop the answer"
                  title="Stop"
                  className="ml-auto inline-flex size-9 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-85"
                >
                  <StopIcon />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label="Send"
                  title="Send"
                  className="ml-auto inline-flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted"
                >
                  <ArrowUpIcon />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

type PickerProps = {
  choice: ModelChoice;
  available: ProviderId[];
  disabled: boolean;
};

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
      className="field w-auto max-w-[45%] py-1.5"
    >
      {PROVIDERS.map((provider) => {
        const ready = available.includes(provider.id);
        return (
          <optgroup key={provider.id} label={ready ? provider.label : `${provider.label} (add your key in Settings)`}>
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
