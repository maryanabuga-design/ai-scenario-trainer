/**
 * The small part of markdown the guides use: `###` headings, bullet and numbered lists, paragraphs
 * and **bold**. It returns plain data for React to draw as elements, so there is no raw HTML.
 */

export type Inline = { text: string; bold?: boolean };

export type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; inlines: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] };

/** Splits a line into plain and **bold** pieces. */
export function parseInline(text: string): Inline[] {
  return text
    .split(/\*\*/)
    .map((piece, index) => (index % 2 === 1 ? { text: piece, bold: true } : { text: piece }))
    .filter((piece) => piece.text.length > 0);
}

export function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", inlines: parseInline(paragraph.join(" ")) });
      paragraph = [];
    }
  };
  for (const raw of markdown.split("\n")) {
    const line = raw.trim();
    const heading = /^#{2,6}\s+(.+)$/.exec(line);
    const bullet = /^[-*]\s+(.+)$/.exec(line);
    const numbered = /^\d+\.\s+(.+)$/.exec(line);
    if (line === "") {
      flush();
    } else if (heading) {
      flush();
      blocks.push({ type: "heading", text: heading[1] });
    } else if (bullet || numbered) {
      flush();
      const ordered = numbered !== null;
      const item = parseInline((bullet ?? numbered)![1]);
      const last = blocks[blocks.length - 1];
      if (last?.type === "list" && last.ordered === ordered) last.items.push(item);
      else blocks.push({ type: "list", ordered, items: [item] });
    } else {
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}
