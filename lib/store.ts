import { useMemo, useSyncExternalStore } from "react";

const SERVER = "server";

/**
 * A value saved in localStorage under one key, readable with a hook.
 * Keeps an in-memory copy so the app still works for this visit when storage is blocked.
 */
export function createStore<T>(key: string) {
  const listeners = new Set<() => void>();
  let memory: string | null | undefined;

  function readRaw(): string | null {
    if (memory !== undefined) return memory;
    try {
      memory = window.localStorage.getItem(key);
    } catch {
      memory = null;
    }
    return memory;
  }

  function notify() {
    listeners.forEach((listener) => listener());
  }

  function onStorage(event: StorageEvent) {
    if (event.key !== key && event.key !== null) return;
    memory = undefined;
    notify();
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  function parse(raw: string | null): T | null {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  return {
    read(): T | null {
      return parse(readRaw());
    },
    write(value: T | null) {
      memory = value === null ? null : JSON.stringify(value);
      try {
        if (memory === null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, memory);
      } catch {
        // Storage is unavailable; the in-memory copy still works for this visit.
      }
      notify();
    },
    /** The saved value. "loading" until the browser has been read, so pages never redirect too early. */
    useValue(): T | null | "loading" {
      const raw = useSyncExternalStore(subscribe, readRaw, () => SERVER);
      return useMemo(() => (raw === SERVER ? "loading" : parse(raw)), [raw]);
    },
  };
}
