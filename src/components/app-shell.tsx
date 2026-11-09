"use client";

import { useState, type ReactNode } from "react";
import { MenuIcon } from "@/components/icons";
import { Sidebar } from "@/components/sidebar";

// Sidebar on the left; on phones it is hidden behind a menu button and slides in over the page.
export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden">
      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
        />
      )}
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 md:hidden">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="rounded-md p-1 hover:bg-surface"
          >
            <MenuIcon />
          </button>
          <span className="font-semibold">SkillForge</span>
        </header>
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
