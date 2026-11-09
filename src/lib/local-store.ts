import { useSyncExternalStore } from "react";
import type { z } from "zod";

// A value kept in localStorage that any component can read with useLocalStore().
// The saved JSON is validated with Zod; anything invalid falls back to the default.
export type LocalStore<T> = {
  get: () => T;
  set: (next: T | ((current: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
};

export function createLocalStore<T>(key: string, schema: z.ZodType<T>, fallback: () => T): LocalStore<T> {
  let cache: T | undefined; // useSyncExternalStore needs the same object back until something changes
  const listeners = new Set<() => void>();

  function read(): T {
    try {
      const saved = localStorage.getItem(key);
      if (saved === null) return fallback();
      const parsed = schema.safeParse(JSON.parse(saved));
      return parsed.success ? parsed.data : fallback();
    } catch {
      return fallback();
    }
  }

  function get(): T {
    if (cache === undefined) cache = read();
    return cache;
  }

  function set(next: T | ((current: T) => T)) {
    cache = typeof next === "function" ? (next as (current: T) => T)(get()) : next;
    try {
      localStorage.setItem(key, JSON.stringify(cache));
    } catch {
      // Storage full or blocked: the value still lives in memory for this tab.
    }
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    // Another tab changed the same key: drop the cached value and re-read.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      cache = undefined;
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  return { get, set, subscribe };
}

// Returns null on the server and during hydration, the stored value in the browser.
export function useLocalStore<T>(store: LocalStore<T>): T | null {
  return useSyncExternalStore(store.subscribe, store.get, () => null);
}
