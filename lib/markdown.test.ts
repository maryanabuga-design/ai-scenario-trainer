import { describe, expect, it } from "vitest";
import { parseBlocks, parseInline } from "@/lib/markdown";

describe("the guide markdown", () => {
  it("turns ### into headings and bullets into a list", () => {
    const blocks = parseBlocks(
      "- First point\n- Second point\n\n### A subsection\n\n- Inside it\n- Another",
    );
    expect(blocks).toEqual([
      {
        type: "list",
        ordered: false,
        items: [[{ text: "First point" }], [{ text: "Second point" }]],
      },
      { type: "heading", text: "A subsection" },
      { type: "list", ordered: false, items: [[{ text: "Inside it" }], [{ text: "Another" }]] },
    ]);
  });

  it("makes paragraphs of plain lines, joined until a blank line", () => {
    expect(parseBlocks("One line\ncontinues here.\n\nNext paragraph.")).toEqual([
      { type: "paragraph", inlines: [{ text: "One line continues here." }] },
      { type: "paragraph", inlines: [{ text: "Next paragraph." }] },
    ]);
  });

  it("makes a numbered list of numbered lines", () => {
    const [list] = parseBlocks("1. Listen\n2. Gather\n3. Move");
    expect(list).toMatchObject({ type: "list", ordered: true });
    expect(list.type === "list" && list.items).toHaveLength(3);
  });

  it("supports bold and nothing else", () => {
    expect(parseInline("A **warning** means flooding")).toEqual([
      { text: "A " },
      { text: "warning", bold: true },
      { text: " means flooding" },
    ]);
    expect(parseInline("no marks")).toEqual([{ text: "no marks" }]);
  });

  it("never produces HTML: markup in the text stays plain text", () => {
    const blocks = parseBlocks("<script>alert(1)</script>\n\n- <b>x</b> **y**");
    const text = JSON.stringify(blocks);
    // the strings are kept as text for React to escape; there is no html node type
    expect(blocks.map((block) => block.type)).toEqual(["paragraph", "list"]);
    expect(text).not.toContain('"html"');
    expect(text).not.toContain("dangerouslySetInnerHTML");
  });

  it("skips empty input", () => {
    expect(parseBlocks("")).toEqual([]);
    expect(parseBlocks("\n\n  \n")).toEqual([]);
  });
});
