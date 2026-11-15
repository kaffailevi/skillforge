"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
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
import { BrandMark } from "@/components/brand";
import { ChatIcon, PencilIcon, PlusIcon, SlidersIcon, TicketIcon, TrashIcon, UserIcon } from "@/components/icons";
import { ThemePicker } from "@/components/theme-picker";

const PAGES = [
  { href: "/", label: "Chat", icon: <ChatIcon /> },
  { href: "/bookings", label: "Bookings", icon: <TicketIcon /> },
  { href: "/profile", label: "Profile", icon: <UserIcon /> },
  { href: "/settings", label: "Settings", icon: <SlidersIcon /> },
];

type SidebarProps = {
  open: boolean; // only matters on small screens, where the sidebar is a slide-in menu
  onNavigate: () => void;
  userMenu: ReactNode;
};

export function Sidebar({ open, onNavigate, userMenu }: SidebarProps) {
  const pathname = usePathname();
  const state = useLocalStore(conversationStore);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform md:static md:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full max-md:invisible"
      }`}
    >
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <BrandMark />
        <div className="leading-tight">
          <p className="font-semibold tracking-tight">SkillForge</p>
          <p className="text-xs text-sidebar-muted">Your AI career mentor</p>
        </div>
      </div>

      <div className="px-3">
        <Link
          href="/"
          onClick={() => {
            startNewChat();
            onNavigate();
          }}
          className="btn btn-primary w-full"
        >
          <PlusIcon />
          New chat
        </Link>
      </div>

      <nav aria-label="Pages" className="mt-4 flex flex-col gap-0.5 px-3 text-sm">
        {PAGES.map((page) => {
          const current = pathname === page.href;
          return (
            <Link
              key={page.href}
              href={page.href}
              onClick={onNavigate}
              aria-current={current ? "page" : undefined}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                current
                  ? "bg-sidebar-active font-medium text-sidebar-foreground"
                  : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
              }`}
            >
              {current && (
                <span aria-hidden="true" className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-sidebar-accent" />
              )}
              <span className={current ? "text-sidebar-accent" : ""}>{page.icon}</span>
              {page.label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-4 mt-5 border-t border-sidebar-border" />
      <h2 className="px-6 pt-4 pb-2 text-[11px] font-semibold tracking-wider text-sidebar-muted uppercase">
        Conversations
      </h2>
      <ul className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-3">
        {state === null ? (
          <li className="px-3 py-1 text-sm text-sidebar-muted">Loading…</li>
        ) : state.conversations.length === 0 ? (
          <li className="px-3 py-1 text-sm text-sidebar-muted">No conversations yet.</li>
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

      <div className="flex flex-col gap-3 border-t border-sidebar-border p-3">
        {userMenu}
        <ThemePicker />
      </div>
    </aside>
  );
}

type ItemProps = {
  conversation: Conversation;
  active: boolean;
  onOpen: () => void;
};

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
            className="min-w-0 flex-1 rounded-md border border-sidebar-accent bg-sidebar-hover px-2 py-1.5 text-sm text-sidebar-foreground focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md px-2 text-xs font-semibold text-sidebar-accent hover:bg-sidebar-hover"
          >
            Save
          </button>
        </form>
      </li>
    );
  }

  if (mode === "confirm-delete") {
    return (
      <li className="my-1 rounded-lg border border-red-400/40 bg-sidebar-hover p-3 text-sm">
        <p>
          Delete <span className="font-medium">“{conversation.title}”</span>?
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => deleteConversation(conversation.id)}
            className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setMode("view")}
            className="rounded-md px-2.5 py-1 text-xs text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-foreground"
          >
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li
      className={`group flex items-center rounded-lg transition-colors ${
        active
          ? "bg-sidebar-hover text-sidebar-foreground"
          : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
      }`}
    >
      <Link
        href="/"
        aria-current={active ? "page" : undefined}
        onClick={() => {
          openConversation(conversation.id);
          onOpen();
        }}
        className={`min-w-0 flex-1 truncate px-3 py-2 text-sm ${active ? "font-medium" : ""}`}
      >
        {conversation.title}
      </Link>
      <div className="flex shrink-0 pr-1 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
        <button
          type="button"
          aria-label={`Rename “${conversation.title}”`}
          title="Rename"
          onClick={() => setMode("rename")}
          className="rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-foreground"
        >
          <PencilIcon />
        </button>
        <button
          type="button"
          aria-label={`Delete “${conversation.title}”`}
          title="Delete"
          onClick={() => setMode("confirm-delete")}
          className="rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-active hover:text-red-400"
        >
          <TrashIcon />
        </button>
      </div>
    </li>
  );
}
