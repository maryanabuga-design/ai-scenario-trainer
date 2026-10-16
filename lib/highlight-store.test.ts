import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Highlight } from "@/lib/highlights";

const storage = new Map<string, string>();
beforeAll(() => {
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => void storage.set(key, value),
      removeItem: (key: string) => void storage.delete(key),
    },
  });
});
afterAll(() => vi.unstubAllGlobals());
beforeEach(() => storage.clear());

const good: Highlight = {
  id: "a",
  block: 0,
  start: 1,
  end: 4,
  quote: "abc",
  before: "",
  after: "",
};

/** The store loaded fresh, as a new page load would have it. */
async function load() {
  vi.resetModules();
  return import("@/lib/highlight-store");
}

describe("saved highlights", () => {
  it("saves the highlights of a topic and keeps the other topics", async () => {
    const store = await load();
    store.saveHighlights("S1", [good]);
    store.saveHighlights("S2", [{ ...good, id: "b" }]);
    const fresh = await load();
    expect(fresh.highlightsFor(fresh.readHighlights(), "S1")).toEqual([good]);
    expect(fresh.highlightsFor(fresh.readHighlights(), "S2")).toHaveLength(1);
    fresh.saveHighlights("S1", []);
    expect(Object.keys((await load()).readHighlights() ?? {})).toEqual(["S2"]);
  });

  it("is kept under its own versioned key, with the schema", async () => {
    const store = await load();
    store.saveHighlights("S1", [good]);
    const saved = JSON.parse(storage.get("ast.highlights.v1")!);
    expect(saved.schema).toBe(6);
    expect(saved.value.S1).toEqual([good]);
  });

  it("loads broken or unknown data as nothing, without crashing", async () => {
    for (const raw of [
      "{not json",
      "null",
      "5",
      JSON.stringify({ schema: 6, value: "text" }),
      JSON.stringify({ schema: 6, value: [1, 2] }),
      JSON.stringify({ schema: 99, value: { S1: [good] } }),
      JSON.stringify({ schema: 5, value: { S1: [{ nope: 1 }, "x", good], S2: 4 } }),
    ]) {
      storage.set("ast.highlights.v1", raw);
      const store = await load();
      expect(() => store.highlightsFor(store.readHighlights(), "S1")).not.toThrow();
    }
    storage.set("ast.highlights.v1", "{not json");
    const store = await load();
    expect(store.readHighlights()).toBeNull();
    expect(store.highlightsFor(store.readHighlights(), "S1")).toEqual([]);
  });

  it("keeps the valid highlights of old data and drops the rest", async () => {
    storage.set(
      "ast.highlights.v1",
      JSON.stringify({ schema: 5, value: { S1: [{ nope: 1 }, "x", good], S2: 4 } }),
    );
    const store = await load();
    expect(store.highlightsFor(store.readHighlights(), "S1")).toEqual([good]);
    expect(store.highlightsFor(store.readHighlights(), "S2")).toEqual([]);
  });

  it("never throws for a wrong shape passed in", async () => {
    const store = await load();
    for (const bad of [null, undefined, 3, "x", [], { S1: "no" }]) {
      expect(store.highlightsFor(bad, "S1")).toEqual([]);
    }
  });
});

describe("the one-time tip", () => {
  it("is remembered once it was seen", async () => {
    const store = await load();
    expect(JSON.stringify(storage.get("ast.reading-tip.v1") ?? null)).toBe("null");
    store.dismissTip();
    const saved = JSON.parse(storage.get("ast.reading-tip.v1")!);
    expect(saved.value).toBe(true);
  });
});
