import { z } from "zod";
import { createLocalStore } from "@/lib/local-store";
import { THEME_KEY } from "@/lib/theme-script";

export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

export const themeStore = createLocalStore<Theme>(THEME_KEY, z.enum(THEMES), () => "system");

// "system" removes the attribute, so the CSS falls back to prefers-color-scheme.
export function applyTheme(theme: Theme) {
  if (theme === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
}

export function setTheme(theme: Theme) {
  themeStore.set(theme);
  applyTheme(theme);
}
