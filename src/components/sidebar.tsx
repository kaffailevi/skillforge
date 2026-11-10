"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import {
  conversationStore,
  deleteConversation,
  newestFirst,
  openConversation,
  renameConversation,
  startNewChat,
  type Conversation,
} from "@/lib/conversations";
import { useLocalStore } from "@/lib/local-store";
import { PencilIcon, TrashIcon } from "@/components/icons";
import { ThemePicker } from "@/components/theme-picker";

type SidebarProps = {
  open: boolean; // only matters on small screens, where the sidebar is a slide-in menu
  onNavigate: () => void;
};

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const state = useLocalStore(conversationStore);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-border bg-surface transition-transform md:static md:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full max-md:invisible"
      }`}
    >
      <div className="px-4 pt-4 pb-3">
        <p className="text-lg font-semibold">SkillForge</p>
        <p className="text-xs text-muted">Your AI career mentor</p>
      </div>

      <div className="px-3">
        <Link
          href="/"
          onClick={() => {
            startNewChat();
            onNavigate();
          }}
          className="block rounded-lg bg-accent px-3 py-2 text-center text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          New chat
        </Link>
      </div>

      <nav aria-label="Pages" className="mt-3 flex flex-col px-2 text-sm">
        {[
          { href: "/", label: "Chat" },
          { href: "/profile", label: "Profile" },
          { href: "/settings", label: "Settings" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={pathname === link.href ? "page" : undefined}
            className={`rounded-lg px-2 py-1.5 ${
              pathname === link.href ? "bg-background font-medium" : "text-muted hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <h2 className="px-4 pt-5 pb-1 text-xs font-medium tracking-wide text-muted uppercase">Conversations</h2>
      <ul className="flex-1 overflow-y-auto px-2 pb-2">
        {state === null ? (
          <li className="px-2 py-1 text-sm text-muted">Loading…</li>
        ) : state.conversations.length === 0 ? (
          <li className="px-2 py-1 text-sm text-muted">No conversations yet.</li>
        ) : (
          newestFirst(state.conversations).map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              active={pathname === "/" && conversation.id === state.activeId}
              onOpen={onNavigate}
            />
          ))
        )}
      </ul>

      <div className="border-t border-border p-3">
        <ThemePicker />
      </div>
    </aside>
  );
}

type ItemProps = { conversation: Conversation; active: boolean; onOpen: () => void };

function ConversationItem({ conversation, active, onOpen }: ItemProps) {
  const [mode, setMode] = useState<"view" | "rename" | "confirm-delete">("view");

  function saveTitle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    renameConversation(conversation.id, String(new FormData(event.currentTarget).get("title") ?? ""));
    setMode("view");
  }

  function cancelOnEscape(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") setMode("view");
  }

  if (mode === "rename") {
    return (
      <li className="py-1">
        <form onSubmit={saveTitle} className="flex gap-1">
          <input
            name="title"
            defaultValue={conversation.title}
            aria-label="Conversation title"
            maxLength={80}
            autoFocus
            onKeyDown={cancelOnEscape}
            className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm"
          />
          <button type="submit" className="rounded-md px-2 text-xs font-medium text-accent">
            Save
          </button>
        </form>
      </li>
    );
  }

  if (mode === "confirm-delete") {
    return (
      <li className="my-1 rounded-lg border border-danger/40 bg-background p-2 text-sm">
        <p>
          Delete <span className="font-medium">“{conversation.title}”</span>?
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => deleteConversation(conversation.id)}
            className="rounded-md bg-danger px-2 py-1 text-xs font-medium text-white"
          >
            Delete
          </button>
          <button type="button" onClick={() => setMode("view")} className="rounded-md px-2 py-1 text-xs">
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className={`group flex items-center rounded-lg ${active ? "bg-background" : "hover:bg-background/60"}`}>
      <Link
        href="/"
        aria-current={active ? "page" : undefined}
        onClick={() => {
          openConversation(conversation.id);
          onOpen();
        }}
        className={`min-w-0 flex-1 truncate px-2 py-2 text-sm ${active ? "font-medium" : ""}`}
      >
        {conversation.title}
      </Link>
      <div className="flex shrink-0 pr-1 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
        <button
          type="button"
          aria-label={`Rename “${conversation.title}”`}
          onClick={() => setMode("rename")}
          className="rounded p-1.5 text-muted hover:text-foreground"
        >
          <PencilIcon />
        </button>
        <button
          type="button"
          aria-label={`Delete “${conversation.title}”`}
          onClick={() => setMode("confirm-delete")}
          className="rounded p-1.5 text-muted hover:text-danger"
        >
          <TrashIcon />
        </button>
      </div>
    </li>
  );
}
