"use client";

import type { ReactNode } from "react";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/icons";
import { useLocalStore } from "@/lib/local-store";
import { setTheme, themeStore, THEMES } from "@/lib/theme";

const ICONS: Record<(typeof THEMES)[number], ReactNode> = {
  light: <SunIcon />,
  dark: <MoonIcon />,
  system: <MonitorIcon />,
};

export function ThemePicker() {
  const theme = useLocalStore(themeStore);

  return (
    <div role="group" aria-label="Theme" className="flex rounded-lg bg-sidebar-hover p-1 text-xs">
      {THEMES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={theme === option}
          onClick={() => setTheme(option)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 capitalize transition-colors ${
            theme === option
              ? "bg-sidebar-active font-medium text-sidebar-foreground shadow-sm"
              : "text-sidebar-muted hover:text-sidebar-foreground"
          }`}
        >
          {ICONS[option]}
          {option}
        </button>
      ))}
    </div>
  );
}
