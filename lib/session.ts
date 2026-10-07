import { useMemo, useSyncExternalStore } from "react";
import type { Confidence, SessionMode } from "@/lib/scenario";

export type Answer = {
  stepId: string;
  optionId: string;
  confidence: Confidence;
  explanation: string;
};

export type Session = {
  mode: SessionMode;
  stepIds: string[];
  index: number;
  phase: "decide" | "feedback";
  answers: Answer[];
  finished: boolean;
};

const KEY = "ast.session.v1";
const SERVER = "server";
const listeners = new Set<() => void>();

/** Last value read or written. Keeps the session working when localStorage is blocked. */
let memory: string | null | undefined;

function readRaw(): string | null {
  if (memory !== undefined) return memory;
  try {
    memory = window.localStorage.getItem(KEY);
  } catch {
    memory = null;
  }
  return memory;
}

function onStorage() {
  memory = undefined;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function saveSession(session: Session) {
  memory = JSON.stringify(session);
  try {
    window.localStorage.setItem(KEY, memory);
  } catch {
    // Storage is unavailable; the in-memory copy still works for this visit.
  }
  listeners.forEach((listener) => listener());
}

export function startSession(mode: SessionMode, stepIds: string[]) {
  saveSession({ mode, stepIds, index: 0, phase: "decide", answers: [], finished: false });
}

function parse(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

/** The saved session. "loading" until the browser has been read, so pages never redirect too early. */
export function useSession(): Session | null | "loading" {
  const raw = useSyncExternalStore(subscribe, readRaw, () => SERVER);
  return useMemo(() => (raw === SERVER ? "loading" : parse(raw)), [raw]);
}
