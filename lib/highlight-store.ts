import { cleanHighlights, isHighlight, MAX_HIGHLIGHTS } from "@/lib/highlights";
import type { Highlight } from "@/lib/highlights";
import { createStore } from "@/lib/store";

type All = Record<string, Highlight[]>;

/** The highlights of every topic, by topic id, in this browser only. Broken data reads as none. */
const store = createStore<All>("ast.highlights.v1", { sanitize: cleanHighlights });

export const useHighlights = store.useValue;
export const readHighlights = () => store.read();

/** The valid highlights of one topic from whatever was read; never throws. */
export function highlightsFor(all: unknown, topicId: string): Highlight[] {
  if (typeof all !== "object" || all === null || Array.isArray(all)) return [];
  const list = (all as Record<string, unknown>)[topicId];
  return Array.isArray(list) ? list.filter(isHighlight).slice(0, MAX_HIGHLIGHTS) : [];
}

/** Saves the highlights of one topic and leaves the other topics as they are. */
export function saveHighlights(topicId: string, list: Highlight[]) {
  const all = { ...(store.read() ?? {}) };
  if (list.length === 0) delete all[topicId];
  else all[topicId] = list;
  store.write(all);
}

/** The one-time tip "select text to highlight it": true once it was seen or used. */
const tipStore = createStore<boolean>("ast.reading-tip.v1");
export const useTipSeen = tipStore.useValue;
export const dismissTip = () => tipStore.write(true);
