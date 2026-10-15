import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { isSaved, toggleSaved } from "@/lib/saved";
import { createStore } from "@/lib/store";

const saved = new Map<string, string>();
beforeAll(() => {
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => void saved.set(key, value),
      removeItem: (key: string) => void saved.delete(key),
    },
  });
});
afterAll(() => vi.unstubAllGlobals());

const read = () => createStore<string[]>("ast.saved.v1").read();

describe("saved questions", () => {
  it("saves a question, keeps the order they were saved in, and removes one by toggling", () => {
    toggleSaved("s1");
    toggleSaved("q-s2-1");
    toggleSaved("s3");
    expect(read()).toEqual(["s1", "q-s2-1", "s3"]);
    toggleSaved("q-s2-1");
    expect(read()).toEqual(["s1", "s3"]);
    toggleSaved("s1");
    toggleSaved("s3");
    expect(read()).toEqual([]);
  });

  it("is saved with the schema version, under its own key", () => {
    toggleSaved("s2");
    expect(JSON.parse(saved.get("ast.saved.v1")!)).toEqual({ schema: 4, value: ["s2"] });
  });

  it("answers whether a question is saved, also before the browser has been read", () => {
    expect(isSaved(["s2"], "s2")).toBe(true);
    expect(isSaved(["s2"], "s1")).toBe(false);
    expect(isSaved(null, "s2")).toBe(false);
    expect(isSaved("loading", "s2")).toBe(false);
  });

  it("ignores saved ids written by another version, without crashing", () => {
    saved.set("ast.saved.v1", JSON.stringify(["s1"]));
    expect(read()).toBeNull();
    saved.set("ast.saved.v1", JSON.stringify({ schema: 1, value: ["s1"] }));
    expect(read()).toBeNull();
  });
});
