import { beforeEach, describe, expect, it, vi } from "vitest";

async function fresh() {
  vi.resetModules();
  return import("@/lib/navigation-origin");
}

describe("where a reading screen was opened from", () => {
  let nav: Awaited<ReturnType<typeof fresh>>;
  beforeEach(async () => {
    nav = await fresh();
  });

  it("uses the history when the Materials list is the origin, also after moving between topics", () => {
    nav.noteNavigation("/materials");
    nav.noteNavigation("/materials/read/S1");
    expect(nav.readingOrigin()).toBe("/materials");
    expect(nav.canGoBackToList()).toBe(true);
    nav.noteNavigation("/materials/read/S2");
    expect(nav.canGoBackToList()).toBe(true);
  });

  it("does not use the history when another screen opened it", () => {
    for (const from of ["/training", "/checklists/leaving-a-building", "/session/results"]) {
      nav.noteNavigation(from);
      nav.noteNavigation("/materials/read/S3");
      expect(nav.readingOrigin()).toBe(from);
      expect(nav.canGoBackToList()).toBe(false);
      nav.noteNavigation("/");
    }
  });

  it("knows nothing after a direct visit", () => {
    nav.noteNavigation("/materials/read/S1");
    expect(nav.readingOrigin()).toBeNull();
    expect(nav.canGoBackToList()).toBe(false);
  });
});

describe("the Materials list scroll", () => {
  it("is restored once, and only when asked", async () => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    });
    const nav = await fresh();
    nav.saveListScroll(480);
    expect(nav.takeListRestore()).toBeNull();
    nav.requestListRestore();
    expect(nav.takeListRestore()).toBe(480);
    expect(nav.takeListRestore()).toBeNull();
    vi.unstubAllGlobals();
  });
});
