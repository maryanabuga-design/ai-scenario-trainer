import { strFromU8, unzipSync } from "fflate";

/**
 * A small reader for `.xlsx` workbooks (DESIGN.md: One document in, a draft topic out). Pure: it
 * unzips the file with `fflate`, reads the sheet names, the shared strings and the cells as plain
 * text, and ignores formatting, formulas, macros, pictures and everything else. Nothing is uploaded
 * and nothing is run. A file that is not a workbook gives null.
 */
export type Sheet = { name: string; rows: string[][] };

const MAX_PART_BYTES = 20 * 1024 * 1024;
const MAX_ROWS = 500;
const MAX_COLUMNS = 30;
const WANTED =
  /^xl\/(workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|worksheets\/[^/]+\.xml)$/;

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
/** XML text to plain text: the five named entities and numeric references. */
const decode = (xml: string) =>
  xml.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity: string) => {
    if (entity[0] !== "#") return ENTITIES[entity.toLowerCase()];
    const code =
      entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : "";
  });

const attr = (tag: string, name: string) => new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(tag)?.[1];

/** The text runs of one `<si>` or `<is>` block, without phonetic hints. */
const runs = (xml: string) =>
  [...xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, "").matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
    .map((m) => decode(m[1]))
    .join("");

/** "C12" to the zero-based column 2. */
const columnOf = (ref: string) => {
  let n = 0;
  for (const ch of ref.replace(/[^A-Z]/gi, "").toUpperCase()) n = n * 26 + ch.charCodeAt(0) - 64;
  return n - 1;
};

export function readWorkbook(bytes: Uint8Array): Sheet[] | null {
  let parts: Record<string, Uint8Array>;
  try {
    parts = unzipSync(bytes, {
      filter: (file) => WANTED.test(file.name) && file.originalSize <= MAX_PART_BYTES,
    });
  } catch {
    return null;
  }
  const workbook = parts["xl/workbook.xml"];
  if (!workbook) return null;

  const rels = new Map<string, string>();
  for (const m of strFromU8(parts["xl/_rels/workbook.xml.rels"] ?? new Uint8Array()).matchAll(
    /<Relationship\b[^>]*>/g,
  )) {
    const id = attr(m[0], "Id");
    const target = attr(m[0], "Target");
    if (id && target) rels.set(id, target.replace(/^\/?(xl\/)?/, "xl/"));
  }
  const shared = [
    ...strFromU8(parts["xl/sharedStrings.xml"] ?? new Uint8Array()).matchAll(
      /<si\b[^>]*>([\s\S]*?)<\/si>/g,
    ),
  ].map((m) => runs(m[1]));

  const sheets: Sheet[] = [];
  for (const m of strFromU8(workbook).matchAll(/<sheet\b[^>]*>/g)) {
    const name = decode(attr(m[0], "name") ?? "");
    const target = rels.get(attr(m[0], "r:id") ?? "");
    const xml = target ? parts[target] : undefined;
    if (!name || !xml) continue;
    const rows: string[][] = [];
    for (const row of strFromU8(xml).matchAll(/<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
      if (rows.length >= MAX_ROWS) break;
      const cells: string[] = [];
      for (const c of (row[1] ?? "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const index = columnOf(attr(c[1], "r") ?? "");
        if (index < 0 || index >= MAX_COLUMNS) continue;
        const type = attr(c[1], "t");
        const value = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(c[2] ?? "")?.[1] ?? "";
        const text =
          type === "s"
            ? (shared[Number(value)] ?? "")
            : type === "inlineStr"
              ? runs(c[2] ?? "")
              : decode(value);
        while (cells.length <= index) cells.push("");
        cells[index] = text.trim();
      }
      rows.push(cells);
    }
    sheets.push({ name, rows });
  }
  return sheets.length > 0 ? sheets : null;
}
