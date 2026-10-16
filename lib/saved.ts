import { cleanSaved } from "@/lib/saved-data";
import { createStore } from "@/lib/store";

/** The ids of the saved (bookmarked) questions, in the order they were saved. */
const savedStore = createStore<string[]>("ast.saved.v1", { sanitize: cleanSaved });

export const useSaved = savedStore.useValue;
export const readSaved = () => savedStore.read();

export function isSaved(saved: string[] | null | "loading", id: string): boolean {
  return Array.isArray(saved) && saved.includes(id);
}

/** Saves a question, or removes it when it is already saved. Reset progress leaves them alone. */
export function toggleSaved(id: string) {
  const current = savedStore.read() ?? [];
  savedStore.write(current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
}
