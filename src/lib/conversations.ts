import { z } from "zod";
import type { ChatMessage } from "@/lib/chat-types";
import { createLocalStore } from "@/lib/local-store";

// Conversations live in the browser until Supabase arrives (step 10).

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
  activeId: z.string().nullable(), // null = a new, empty chat
});

export type Conversation = z.infer<typeof Conversation>;
export type ConversationsState = z.infer<typeof ConversationsState>;

export const conversationStore = createLocalStore("skillforge.conversations", ConversationsState, {
  conversations: [],
  activeId: null,
});

const TITLE_LENGTH = 40;

export function titleFrom(firstMessage: string): string {
  const firstLine = firstMessage.trim().split("\n")[0];
  return firstLine.length > TITLE_LENGTH ? `${firstLine.slice(0, TITLE_LENGTH).trimEnd()}…` : firstLine;
}

export function newestFirst(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function startNewChat() {
  conversationStore.set((state) => ({ ...state, activeId: null }));
}

export function openConversation(id: string) {
  conversationStore.set((state) => ({ ...state, activeId: id }));
}

// Creates a conversation titled after its first message and makes it the open one.
export function createConversation(firstMessage: ChatMessage): string {
  const now = Date.now();
  const conversation: Conversation = {
    id: crypto.randomUUID(),
    title: titleFrom(firstMessage.content),
    createdAt: now,
    updatedAt: now,
    messages: [firstMessage],
  };
  conversationStore.set((state) => ({
    conversations: [...state.conversations, conversation],
    activeId: conversation.id,
  }));
  return conversation.id;
}

export function updateMessages(id: string, update: (messages: ChatMessage[]) => ChatMessage[]) {
  conversationStore.set((state) => ({
    ...state,
    conversations: state.conversations.map((conversation) =>
      conversation.id === id
        ? { ...conversation, messages: update(conversation.messages), updatedAt: Date.now() }
        : conversation,
    ),
  }));
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
    activeId: state.activeId === id ? null : state.activeId,
  }));
}
