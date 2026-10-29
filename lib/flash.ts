import { useSyncExternalStore } from "react";

/**
 * The confirmation after an action (DESIGN.md: Instructor content flow polish): ONE message that is
 * kept in memory (never in the address) and shown by the screen the person lands on. A new message
 * replaces the old one. CLIENT ONLY.
 */
export type Flash = { id: number; text: string; path: string };

export const FLASH_MS = 6000;

let current: Flash | null = null;
let counter = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

/** Shows `text` on the screen at `path` (a pathname, without query), replacing any message. */
export function setFlash(text: string, path: string) {
  counter += 1;
  current = { id: counter, text, path };
  emit();
}

/** Removes the message (when it is the one with this id, or any when no id is given). */
export function clearFlash(id?: number) {
  if (current && (id === undefined || current.id === id)) {
    current = null;
    emit();
  }
}

export function useFlash(): Flash | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
    () => null,
  );
}

/** The pathname of an address ("/a/b?x=1#y" gives "/a/b"). */
export const pathOf = (url: string) => url.split(/[?#]/)[0];
