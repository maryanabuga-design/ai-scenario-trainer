import { describe, expect, it } from "vitest";
import {
  MAX_HIGHLIGHTS,
  addHighlights,
  applyHighlights,
  blockTexts,
  cleanHighlights,
  highlightAt,
  isHighlight,
  mergeRanges,
  reanchor,
  removeHighlight,
  splitSelection,
} from "@/lib/highlights";
import type { Highlight } from "@/lib/highlights";
import { parseInline } from "@/lib/markdown";

const texts = [
  "Treat every alarm as real until it is officially confirmed otherwise.",
  "Do not use elevators during a fire. Use the stairs.",
  "Keep one hand on the wall.",
];
let n = 0;
const ids = () => `id${++n}`;

describe("merging ranges", () => {
  it("merges overlapping ranges", () => {
    expect(mergeRanges([{ start: 2, end: 8 }], { start: 5, end: 12 })).toEqual([
      { start: 2, end: 12 },
    ]);
  });

  it("merges touching ranges (adjacency)", () => {
    expect(mergeRanges([{ start: 2, end: 5 }], { start: 5, end: 9 })).toEqual([
      { start: 2, end: 9 },
    ]);
    expect(mergeRanges([{ start: 5, end: 9 }], { start: 2, end: 5 })).toEqual([
      { start: 2, end: 9 },
    ]);
  });

  it("swallows nested ranges, in either direction", () => {
    expect(mergeRanges([{ start: 0, end: 20 }], { start: 5, end: 8 })).toEqual([
      { start: 0, end: 20 },
    ]);
    expect(mergeRanges([{ start: 5, end: 8 }], { start: 0, end: 20 })).toEqual([
      { start: 0, end: 20 },
    ]);
  });

  it("keeps separate ranges apart and in order, and merges several at once", () => {
    expect(
      mergeRanges(
        [
          { start: 10, end: 12 },
          { start: 0, end: 2 },
        ],
        { start: 5, end: 7 },
      ),
    ).toEqual([
      { start: 0, end: 2 },
      { start: 5, end: 7 },
      { start: 10, end: 12 },
    ]);
    expect(
      mergeRanges(
        [
          { start: 0, end: 4 },
          { start: 6, end: 10 },
        ],
        { start: 3, end: 7 },
      ),
    ).toEqual([{ start: 0, end: 10 }]);
  });
});

describe("splitting a selection across blocks", () => {
  it("makes one piece per block, the first from its offset, the last up to its offset", () => {
    expect(splitSelection(texts, { block: 0, offset: 38 }, { block: 2, offset: 8 })).toEqual([
      { block: 0, start: 38, end: texts[0].length },
      { block: 1, start: 0, end: texts[1].length },
      { block: 2, start: 0, end: 8 },
    ]);
  });

  it("is one piece inside a single block, and leaves spaces at the ends out", () => {
    const start = texts[1].indexOf("elevators");
    const end = texts[1].indexOf(" during");
    expect(
      splitSelection(texts, { block: 1, offset: start - 1 }, { block: 1, offset: end + 1 }),
    ).toEqual([{ block: 1, start, end }]);
  });

  it("skips a block with nothing selected", () => {
    expect(
      splitSelection(["abc", "   ", "def"], { block: 0, offset: 3 }, { block: 2, offset: 0 }),
    ).toEqual([]);
  });
});

describe("adding and removing highlights", () => {
  it("stores the block, the offsets, the quote and the context", () => {
    const { list, added } = addHighlights([], [{ block: 0, start: 6, end: 17 }], texts, ids);
    expect(added).toBe(true);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      block: 0,
      start: 6,
      end: 17,
      quote: "every alarm",
      before: "Treat ",
      after: " as real unt",
    });
  });

  it("makes one highlight per block for a selection across blocks", () => {
    const pieces = splitSelection(texts, { block: 0, offset: 38 }, { block: 1, offset: 10 });
    const { list } = addHighlights([], pieces, texts, ids);
    expect(list.map((h) => [h.block, h.quote])).toEqual([
      [0, "officially confirmed otherwise."],
      [1, "Do not use"],
    ]);
  });

  it("merges a new highlight that overlaps or touches an existing one, and rebuilds its quote", () => {
    const first = addHighlights([], [{ block: 0, start: 6, end: 17 }], texts, ids).list;
    const overlap = addHighlights(first, [{ block: 0, start: 12, end: 25 }], texts, ids).list;
    expect(overlap).toHaveLength(1);
    expect(overlap[0]).toMatchObject({ start: 6, end: 25, quote: "every alarm as real" });
    const touching = addHighlights(overlap, [{ block: 0, start: 25, end: 31 }], texts, ids).list;
    expect(touching).toHaveLength(1);
    expect(touching[0].quote).toBe("every alarm as real until");
    // another block is separate
    expect(addHighlights(touching, [{ block: 1, start: 0, end: 6 }], texts, ids).list).toHaveLength(
      2,
    );
  });

  it("removes only the chosen highlight", () => {
    const { list } = addHighlights(
      [],
      [
        { block: 0, start: 0, end: 5 },
        { block: 1, start: 0, end: 6 },
      ],
      texts,
      ids,
    );
    expect(removeHighlight(list, list[0].id).map((h) => h.quote)).toEqual(["Do not"]);
    expect(removeHighlight(list, "nope")).toHaveLength(2);
  });

  it("allows at most 100 highlights and refuses the 101st, but still lets one merge", () => {
    const long = [Array.from({ length: 300 }, () => "ab").join(" ")];
    let list: Highlight[] = [];
    for (let i = 0; i < MAX_HIGHLIGHTS; i++) {
      list = addHighlights(list, [{ block: 0, start: i * 6, end: i * 6 + 2 }], long, ids).list;
    }
    expect(list).toHaveLength(100);
    const refused = addHighlights(list, [{ block: 0, start: 700, end: 702 }], long, ids);
    expect(refused.added).toBe(false);
    expect(refused.list).toHaveLength(100);
    // a piece that touches an existing highlight merges instead of adding one
    const merged = addHighlights(list, [{ block: 0, start: 2, end: 4 }], long, ids);
    expect(merged.added).toBe(true);
    expect(merged.list).toHaveLength(100);
  });

  it("finds the highlight under a point", () => {
    const { list } = addHighlights([], [{ block: 0, start: 6, end: 17 }], texts, ids);
    expect(highlightAt(list, 0, 10)?.quote).toBe("every alarm");
    expect(highlightAt(list, 0, 17)).toBeUndefined();
    expect(highlightAt(list, 1, 10)).toBeUndefined();
  });
});

describe("re-anchoring after the text changed", () => {
  const base = addHighlights([], [{ block: 0, start: 6, end: 17 }], texts, ids).list;

  it("keeps a highlight whose quote is still at its offsets", () => {
    expect(reanchor(base, texts)).toEqual(base);
  });

  it("finds the quote again when the text moved, using the context first", () => {
    const moved = ["Note: " + texts[0], ...texts.slice(1)];
    const [found] = reanchor(base, moved);
    expect(found.start).toBe(12);
    expect(moved[0].slice(found.start, found.end)).toBe("every alarm");
    // the same words twice: the context picks the right one
    const twice = [
      "every alarm here. Treat every alarm as real until it is officially confirmed otherwise.",
    ];
    const [second] = reanchor(base, twice);
    expect(second.start).toBe(twice[0].indexOf("Treat ") + 6);
  });

  it("drops a highlight whose quote is gone, or whose block is gone, without failing", () => {
    expect(reanchor(base, ["Something else entirely.", ...texts.slice(1)])).toEqual([]);
    expect(reanchor(base, [])).toEqual([]);
    expect(reanchor([], texts)).toEqual([]);
  });
});

describe("loading broken data", () => {
  const good: Highlight = {
    id: "a",
    block: 0,
    start: 1,
    end: 4,
    quote: "abc",
    before: "",
    after: "",
  };

  it("accepts a valid highlight and rejects anything else", () => {
    expect(isHighlight(good)).toBe(true);
    for (const bad of [
      null,
      4,
      "x",
      [],
      {},
      { ...good, start: 5, end: 2 },
      { ...good, block: -1 },
      { ...good, quote: 3 },
    ]) {
      expect(isHighlight(bad)).toBe(false);
    }
  });

  it("cleans the saved data: valid highlights stay, the rest goes, and the wrong shape is empty", () => {
    expect(cleanHighlights({ S1: [good, { nope: true }, 7], S2: "no", S3: [] })).toEqual({
      S1: [good],
    });
    for (const bad of [null, 3, "x", [], undefined]) expect(cleanHighlights(bad)).toBeNull();
    expect(cleanHighlights({ S1: Array.from({ length: 150 }, () => good) })!.S1).toHaveLength(100);
  });
});

describe("drawing a block with highlights", () => {
  it("splits the text at the edges of a highlight, bold pieces included, without changing it", () => {
    const inlines = parseInline("A **warning** means flooding");
    const highlight: Highlight = {
      id: "h",
      block: 0,
      start: 4,
      end: 16,
      quote: "",
      before: "",
      after: "",
    };
    const segments = applyHighlights(inlines, [highlight]);
    expect(segments.map((s) => s.text).join("")).toBe("A warning means flooding");
    expect(segments).toEqual([
      { text: "A " },
      { text: "wa", bold: true },
      { text: "rning", bold: true, mark: "h" },
      { text: " means ", mark: "h" },
      { text: "flooding" },
    ]);
  });

  it("returns the text as it is when there is nothing to highlight", () => {
    const inlines = parseInline("plain **bold** text");
    expect(applyHighlights(inlines, [])).toEqual([
      { text: "plain " },
      { text: "bold", bold: true },
      { text: " text" },
    ]);
  });
});

describe("the blocks of a topic", () => {
  it("are the paragraphs and the list items, in order, without the headings", () => {
    expect(blockTexts("- One\n- Two **bold**\n\n### Heading\n\nA paragraph.\n\n1. Third")).toEqual([
      "One",
      "Two bold",
      "A paragraph.",
      "Third",
    ]);
  });
});
