import { parseBlocks } from "@/lib/markdown";
import type { Inline } from "@/lib/markdown";

/** Highlights of the reading screen, kept per topic in this browser only. */

export type Range = { start: number; end: number };

/** One highlight: where it is (block, offsets) and what it says, with a little context to find it again. */
export type Highlight = {
  id: string;
  /** The index of the block (a paragraph or a list item) in the topic body. */
  block: number;
  start: number;
  end: number;
  quote: string;
  before: string;
  after: string;
};

/** A piece of one block that a selection covers. */
export type Piece = { block: number; start: number; end: number };

export const MAX_HIGHLIGHTS = 100;

/** The characters of context kept on each side of a quote. */
const CONTEXT = 12;

let counter = 0;
export function newId(): string {
  counter += 1;
  return `h${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

/** The plain text of every highlightable block of a topic body: paragraphs and list items, in order. */
export function blockTexts(markdown: string): string[] {
  return parseBlocks(markdown).flatMap((block) => {
    if (block.type === "paragraph") return [block.inlines.map((piece) => piece.text).join("")];
    if (block.type === "list") return block.items.map((item) => item.map((p) => p.text).join(""));
    return [];
  });
}

/** Adds a range to a sorted list of ranges; ranges that overlap or touch it become one. */
export function mergeRanges(ranges: Range[], added: Range): Range[] {
  const merged: Range[] = [];
  let current = { ...added };
  for (const range of [...ranges].sort((a, b) => a.start - b.start)) {
    if (range.end < current.start || range.start > current.end) merged.push({ ...range });
    else
      current = {
        start: Math.min(range.start, current.start),
        end: Math.max(range.end, current.end),
      };
  }
  merged.push(current);
  return merged.sort((a, b) => a.start - b.start);
}

/**
 * The pieces of a selection from one place to another, one per block it covers: the first block
 * from its offset, the last up to its offset, the ones in between whole. Spaces at the ends of a
 * piece are left out, and a piece with no text is skipped.
 */
export function splitSelection(
  texts: string[],
  from: { block: number; offset: number },
  to: { block: number; offset: number },
): Piece[] {
  const pieces: Piece[] = [];
  for (let block = from.block; block <= to.block; block++) {
    const text = texts[block] ?? "";
    let start = block === from.block ? from.offset : 0;
    let end = block === to.block ? to.offset : text.length;
    while (start < end && /\s/.test(text[start])) start++;
    while (end > start && /\s/.test(text[end - 1])) end--;
    if (end > start) pieces.push({ block, start, end });
  }
  return pieces;
}

function make(texts: string[], block: number, start: number, end: number, id = newId()): Highlight {
  const text = texts[block] ?? "";
  return {
    id,
    block,
    start,
    end,
    quote: text.slice(start, end),
    before: text.slice(Math.max(0, start - CONTEXT), start),
    after: text.slice(end, end + CONTEXT),
  };
}

/**
 * Adds the pieces of a selection to the highlights. Pieces that overlap or touch highlights of
 * their block merge with them. When the result would hold more than MAX_HIGHLIGHTS nothing is added.
 */
export function addHighlights(
  list: Highlight[],
  pieces: Piece[],
  texts: string[],
  makeId: () => string = newId,
): { list: Highlight[]; added: boolean } {
  let next = [...list];
  for (const piece of pieces) {
    const own = next.filter((highlight) => highlight.block === piece.block);
    const merged = mergeRanges(own, piece);
    const keep = next.filter((highlight) => highlight.block !== piece.block);
    const rebuilt = merged.map((range) => {
      const same = own.find((h) => h.start === range.start && h.end === range.end);
      return same ?? make(texts, piece.block, range.start, range.end, makeId());
    });
    next = [...keep, ...rebuilt];
  }
  if (next.length > MAX_HIGHLIGHTS) return { list, added: false };
  return { list: next.sort((a, b) => a.block - b.block || a.start - b.start), added: true };
}

export function removeHighlight(list: Highlight[], id: string): Highlight[] {
  return list.filter((highlight) => highlight.id !== id);
}

/**
 * Places the highlights on the current text: where they were if the quote is still there,
 * otherwise where the quote (with its context first) is found in the block, otherwise they are
 * dropped. A text that changed never breaks the page.
 */
export function reanchor(list: Highlight[], texts: string[]): Highlight[] {
  const result: Highlight[] = [];
  for (const highlight of list) {
    const text = texts[highlight.block];
    if (text === undefined) continue;
    if (text.slice(highlight.start, highlight.end) === highlight.quote) {
      result.push(highlight);
      continue;
    }
    const withContext = highlight.before + highlight.quote + highlight.after;
    let at = text.indexOf(withContext);
    if (at !== -1) at += highlight.before.length;
    else at = text.indexOf(highlight.quote);
    if (at === -1 || highlight.quote.length === 0) continue;
    result.push({ ...highlight, start: at, end: at + highlight.quote.length });
  }
  // two highlights that landed on the same text count once
  return result.filter(
    (h, index) => result.findIndex((o) => o.block === h.block && o.start === h.start) === index,
  );
}

export function isHighlight(value: unknown): value is Highlight {
  const h = value as Highlight | null;
  return (
    !!h &&
    typeof h === "object" &&
    typeof h.id === "string" &&
    Number.isInteger(h.block) &&
    h.block >= 0 &&
    Number.isInteger(h.start) &&
    Number.isInteger(h.end) &&
    h.start >= 0 &&
    h.end > h.start &&
    typeof h.quote === "string" &&
    typeof h.before === "string" &&
    typeof h.after === "string"
  );
}

/** The saved highlights of every topic, cleaned: anything that is not a valid highlight is dropped. */
export function cleanHighlights(value: unknown): Record<string, Highlight[]> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const result: Record<string, Highlight[]> = {};
  for (const [topic, list] of Object.entries(value)) {
    if (!Array.isArray(list)) continue;
    const valid = list.filter(isHighlight).slice(0, MAX_HIGHLIGHTS);
    if (valid.length > 0) result[topic] = valid;
  }
  return result;
}

/** A piece of a block's text for drawing: plain, bold, and/or inside a highlight. */
export type Segment = { text: string; bold?: boolean; mark?: string };

/**
 * Splits the inline pieces of a block at the edges of its highlights, so each highlighted part can
 * be wrapped on its own, bold pieces included. The text of the segments joined is the block text.
 */
export function applyHighlights(inlines: Inline[], highlights: Highlight[]): Segment[] {
  const segments: Segment[] = [];
  let offset = 0;
  for (const piece of inlines) {
    const end = offset + piece.text.length;
    const cuts = new Set<number>([offset, end]);
    for (const h of highlights) {
      if (h.start > offset && h.start < end) cuts.add(h.start);
      if (h.end > offset && h.end < end) cuts.add(h.end);
    }
    const points = [...cuts].sort((a, b) => a - b);
    for (let i = 0; i < points.length - 1; i++) {
      const [from, to] = [points[i], points[i + 1]];
      const mark = highlights.find((h) => h.start <= from && h.end >= to)?.id;
      segments.push({
        text: piece.text.slice(from - offset, to - offset),
        ...(piece.bold && { bold: true }),
        ...(mark && { mark }),
      });
    }
    offset = end;
  }
  return segments;
}

/** The highlight that covers a point of a block, if any. */
export function highlightAt(
  list: Highlight[],
  block: number,
  offset: number,
): Highlight | undefined {
  return list.find((h) => h.block === block && h.start <= offset && offset < h.end);
}
