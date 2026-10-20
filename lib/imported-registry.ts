import type { Item } from "@/lib/items";

/**
 * Where a question of a published instructor set is found by id. PURE and tiny, so `lib/items.ts`
 * (which server pages import) can ask it without touching storage: the client module
 * `lib/content-sets.ts` registers the resolver that reads the saved sets.
 */
let resolver: ((id: string) => Item | undefined) | null = null;

export function registerImportedResolver(next: (id: string) => Item | undefined) {
  resolver = next;
}

export const findImported = (id: string): Item | undefined => resolver?.(id);
