import { useMemo } from "react";
import { cleanThreads } from "@/lib/ask-ai";
import type { Thread } from "@/lib/ask-ai";
import { createStore } from "@/lib/store";

/** The conversations of the Ask AI tab, in this browser (a key of its own, tolerant loading). */
const store = createStore<Thread[]>("ast.ask-ai.v1", { sanitize: cleanThreads });

/** The threads, newest first; "loading" until the browser has been read. Cleaned on every read. */
export function useThreads(): Thread[] | "loading" {
  const raw = store.useValue();
  return useMemo(() => (raw === "loading" ? "loading" : (cleanThreads(raw) ?? [])), [raw]);
}

export const readThreads = (): Thread[] => cleanThreads(store.read()) ?? [];
export const writeThreads = (threads: Thread[]) => store.write(threads.length > 0 ? threads : null);
