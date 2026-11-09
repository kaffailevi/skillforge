import { z } from "zod";
import type { ChatMessage } from "@/lib/chat-types";
import { createLocalStore } from "@/lib/local-store";

// Conversations live in the browser until Supabase arrives (step 10).
// activeId always has a value. If no conversation has that id yet, the open chat is a new, empty one;
// it is saved under that id when its first message is sent, so the chat never has to change its id.

const Message = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const Conversation = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  messages: z.array(Message),
});

const ConversationsState = z.object({
  conversations: z.array(Conversation),
  // Steps 3–4 saved null for "new chat"; turn it into a fresh id.
  activeId: z
    .string()
    .nullable()
    .transform((id) => id ?? crypto.randomUUID()),
});

export type Conversation = z.infer<typeof Conversation>;
export type ConversationsState = z.infer<typeof ConversationsState>;

export const conversationStore = createLocalStore("skillforge.conversations", ConversationsState, () => ({
  conversations: [],
  activeId: crypto.randomUUID(),
}));

const TITLE_LENGTH = 40;

export function titleFrom(firstMessage: string): string {
  const firstLine = firstMessage.trim().split("\n")[0];
  return firstLine.length > TITLE_LENGTH ? `${firstLine.slice(0, TITLE_LENGTH).trimEnd()}…` : firstLine;
}

export function newestFirst(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
}

function isSaved(state: ConversationsState, id: string): boolean {
  return state.conversations.some((conversation) => conversation.id === id);
}

export function startNewChat() {
  conversationStore.set((state) =>
    isSaved(state, state.activeId) ? { ...state, activeId: crypto.randomUUID() } : state,
  );
}

export function openConversation(id: string) {
  conversationStore.set((state) => ({ ...state, activeId: id }));
}

// Stores the messages of a conversation; the first save creates it, titled after its first message.
export function saveMessages(id: string, messages: ChatMessage[]) {
  if (messages.length === 0) return;
  const now = Date.now();
  conversationStore.set((state) => {
    const existing = state.conversations.find((conversation) => conversation.id === id);
    if (existing) {
      const unchanged = JSON.stringify(existing.messages) === JSON.stringify(messages);
      if (unchanged) return state;
      return {
        ...state,
        conversations: state.conversations.map((conversation) =>
          conversation.id === id ? { ...conversation, messages, updatedAt: now } : conversation,
        ),
      };
    }
    const firstUserMessage = messages.find((message) => message.role === "user")?.content ?? "New chat";
    return {
      ...state,
      conversations: [
        ...state.conversations,
        { id, title: titleFrom(firstUserMessage), createdAt: now, updatedAt: now, messages },
      ],
    };
  });
}

export function renameConversation(id: string, title: string) {
  const trimmed = title.trim();
  if (!trimmed) return;
  conversationStore.set((state) => ({
    ...state,
    conversations: state.conversations.map((conversation) =>
      conversation.id === id ? { ...conversation, title: trimmed.slice(0, 80) } : conversation,
    ),
  }));
}

export function deleteConversation(id: string) {
  conversationStore.set((state) => ({
    conversations: state.conversations.filter((conversation) => conversation.id !== id),
    activeId: state.activeId === id ? crypto.randomUUID() : state.activeId,
  }));
}
