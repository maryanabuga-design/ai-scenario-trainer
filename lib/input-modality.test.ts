import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { trackInputModality } from "@/lib/input-modality";

function fakeDocument() {
  const target = new EventTarget();
  const root = { dataset: {} as DOMStringMap };
  return Object.assign(target, { documentElement: root }) as unknown as Document;
}

function key(name: string) {
  return Object.assign(new Event("keydown"), { key: name });
}

describe("focus ring only for the keyboard", () => {
  it("a mouse click or tap switches the ring off, a navigation key switches it on", () => {
    const doc = fakeDocument();
    const stop = trackInputModality(doc);
    doc.dispatchEvent(new Event("pointerdown"));
    expect(doc.documentElement.dataset.input).toBe("pointer");
    doc.dispatchEvent(key("Tab"));
    expect(doc.documentElement.dataset.input).toBe("keyboard");
    doc.dispatchEvent(new Event("pointerdown"));
    doc.dispatchEvent(key("a"));
    expect(doc.documentElement.dataset.input).toBe("pointer");
    doc.dispatchEvent(key("ArrowRight"));
    expect(doc.documentElement.dataset.input).toBe("keyboard");
    stop();
  });

  it("hides the ring in pointer mode and keeps it for the keyboard", () => {
    const css = readFileSync("app/globals.css", "utf8");
    expect(css).toMatch(/:focus-visible \{\s*outline: 2px solid var\(--accent\);/);
    expect(css).toContain(':root[data-input="pointer"] :focus-visible');
    expect(css).toContain(':root[data-input="pointer"] :has(:focus-visible)');
  });
});
