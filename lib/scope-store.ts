import { useMemo } from "react";
import { DEFAULT_GROUP_ID, isScope } from "@/lib/groups";
import type { Scope } from "@/lib/groups";
import { createStore } from "@/lib/store";

/**
 * The group the Instructor is looking at (DESIGN.md: Instructor, scope): "all" or one group id,
 * kept per account in the versioned key `ast.instructor-scope.v1`. A value that is not a known
 * scope reads as the default group.
 */
const store = createStore<Scope>("ast.instructor-scope.v1", {
  sanitize: (value) => (isScope(value) ? value : null),
});

export const readScope = (): Scope => {
  const saved = store.read();
  return isScope(saved) ? saved : DEFAULT_GROUP_ID;
};

/** The scope, "loading" until the browser has been read. */
export function useScope(): Scope | "loading" {
  const raw = store.useValue();
  return useMemo(
    () => (raw === "loading" ? "loading" : isScope(raw) ? raw : DEFAULT_GROUP_ID),
    [raw],
  );
}

export const saveScope = (scope: Scope): boolean => store.write(isScope(scope) ? scope : null);
