import { useMemo, useSyncExternalStore } from "react";
import { contentFingerprint } from "@/lib/content-version";

const SERVER = "server";

/**
 * The central key helper (DESIGN.md: Accounts): every stored value gets the suffix of the signed-in
 * account (`:<email>`), so each account has its own progress in this browser. The suffix is set by
 * `lib/auth.ts`; an empty suffix is the data the app had before accounts. Stores created with
 * `shared: true` (the auth store itself) never get a suffix. Changing the suffix makes every store
 * read its own key again.
 */
let namespace = "";
const refreshers = new Set<() => void>();
const SHARED_PREFIX = "ast.auth.";

export function setStorageNamespace(next: string) {
  if (next === namespace) return;
  namespace = next;
  refreshers.forEach((refresh) => refresh());
}

export const storageNamespace = () => namespace;

/** Every key this app writes starts with this prefix (localStorage and sessionStorage alike). */
export const APP_KEY_PREFIX = "ast.";

/**
 * Restart demo (DESIGN.md: Restart demo): removes EVERY storage key the app uses, whatever account
 * it belongs to (the accounts, the session, all progress, onboarding flags, exams, notifications,
 * saved questions, highlights, trainings, uploads, and anything added later with the prefix).
 * The next page load starts from nothing.
 */
export function clearAllAppData() {
  for (const storage of ["localStorage", "sessionStorage"] as const) {
    try {
      const area = window[storage];
      const keys: string[] = [];
      for (let i = 0; i < area.length; i++) {
        const key = area.key(i);
        if (key && key.startsWith(APP_KEY_PREFIX)) keys.push(key);
      }
      keys.forEach((key) => area.removeItem(key));
    } catch {
      // Storage is unavailable: nothing was saved there.
    }
  }
  refreshers.forEach((refresh) => refresh());
}

/** Removes every saved value of one namespace (the data of an account). Shared values stay. */
export function clearNamespaceData(suffix: string) {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith("ast.") || key.startsWith(SHARED_PREFIX)) continue;
      const own = suffix === "" ? !key.includes(":") : key.endsWith(suffix);
      if (own) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Storage is unavailable: nothing was saved there.
  }
  refreshers.forEach((refresh) => refresh());
}

/** The version of everything saved in this browser. A saved value of another version is ignored. */
export const SCHEMA_VERSION = 6;

/**
 * Versions whose saved values this version can read as they are. Versions 3 to 6 only add fields
 * (hintUsed, the saved questions, the part results, partId and returnTo, the exam entries of the history,
 * the content fingerprint), so older values migrate
 * by being read and written back as 4.
 */
const READABLE = [2, 3, 4, 5, 6];

/**
 * A value saved in localStorage under one key, readable with a hook. It is saved with the schema
 * version (DESIGN.md: Storage) and read as nothing when the version differs.
 * Keeps an in-memory copy so the app still works for this visit when storage is blocked.
 */
export function createStore<T>(
  key: string,
  {
    versioned = true,
    shared = false,
    sanitize,
  }: {
    versioned?: boolean;
    /** Not per account: the one value of the whole device (the auth store). */
    shared?: boolean;
    /**
     * Cleans a value that was saved for other content (its fingerprint differs or is missing):
     * unknown ids are dropped. It returns null for an empty state and never has to be called when
     * the fingerprint matches.
     */
    sanitize?: (value: unknown) => T | null;
  } = {},
) {
  const listeners = new Set<() => void>();
  let memory: string | null | undefined;
  const fullKey = () => (shared ? key : key + namespace);
  refreshers.add(() => {
    memory = undefined;
    notify();
  });

  function readRaw(): string | null {
    if (memory !== undefined) return memory;
    try {
      memory = window.localStorage.getItem(fullKey());
    } catch {
      memory = null;
    }
    return memory;
  }

  function notify() {
    listeners.forEach((listener) => listener());
  }

  function onStorage(event: StorageEvent) {
    if (event.key !== fullKey() && event.key !== null) return;
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
        const { schema, value, content } = saved as {
          schema: unknown;
          value: unknown;
          content?: unknown;
        };
        if (typeof schema !== "number" || !READABLE.includes(schema)) return null;
        if (!sanitize) return value as T;
        // Data saved for the same content is used as it is; anything else is cleaned first.
        return content === contentFingerprint ? (value as T) : sanitize(value);
      }
      return null;
    } catch {
      // Corrupted or incompatible data reads as an empty state instead of crashing the app.
      return null;
    }
  }

  return {
    read(): T | null {
      return parse(readRaw());
    },
    /** The saved text as it is, for callers that cache what they build from it. */
    raw(): string | null {
      return readRaw();
    },
    /** Saves the value. False when the browser could not keep it (storage full or blocked): it still works for this visit. */
    write(value: T | null): boolean {
      let saved = true;
      memory =
        value === null
          ? null
          : JSON.stringify(
              versioned ? { schema: SCHEMA_VERSION, content: contentFingerprint, value } : value,
            );
      try {
        if (memory === null) window.localStorage.removeItem(fullKey());
        else window.localStorage.setItem(fullKey(), memory);
      } catch {
        // Storage is unavailable; the in-memory copy still works for this visit.
        saved = false;
      }
      notify();
      return saved;
    },
    /** The saved value. "loading" until the browser has been read, so pages never redirect too early. */
    useValue(): T | null | "loading" {
      const raw = useSyncExternalStore(subscribe, readRaw, () => SERVER);
      return useMemo(() => (raw === SERVER ? "loading" : parse(raw)), [raw]);
    },
  };
}
