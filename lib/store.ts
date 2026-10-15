import { useMemo, useSyncExternalStore } from "react";

const SERVER = "server";

/** The version of everything saved in this browser. A saved value of another version is ignored. */
export const SCHEMA_VERSION = 3;

/**
 * Versions whose saved values this version can read as they are. Version 3 only adds fields
 * (hintUsed, the saved questions), so version 2 values migrate by being read and written back as 3.
 */
const READABLE = [2, 3];

/**
 * A value saved in localStorage under one key, readable with a hook. It is saved with the schema
 * version (DESIGN.md: Storage) and read as nothing when the version differs.
 * Keeps an in-memory copy so the app still works for this visit when storage is blocked.
 */
export function createStore<T>(key: string, { versioned = true }: { versioned?: boolean } = {}) {
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
      const saved = JSON.parse(raw) as unknown;
      if (!versioned) return saved as T;
      // Values saved before versioning, or by another version, are not read.
      if (saved && typeof saved === "object" && "schema" in saved && "value" in saved) {
        const { schema, value } = saved as { schema: unknown; value: T };
        return typeof schema === "number" && READABLE.includes(schema) ? value : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  return {
    read(): T | null {
      return parse(readRaw());
    },
    write(value: T | null) {
      memory =
        value === null
          ? null
          : JSON.stringify(versioned ? { schema: SCHEMA_VERSION, value } : value);
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
