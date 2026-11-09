"use client";

import { useLocalStore } from "@/lib/local-store";
import { setTheme, themeStore, THEMES } from "@/lib/theme";

export function ThemePicker() {
  const theme = useLocalStore(themeStore);

  return (
    <div role="group" aria-label="Theme" className="flex rounded-lg border border-border p-0.5 text-xs">
      {THEMES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={theme === option}
          onClick={() => setTheme(option)}
          className={`flex-1 rounded-md px-2 py-1 capitalize ${
            theme === option ? "bg-background font-medium shadow-sm" : "text-muted hover:text-foreground"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
