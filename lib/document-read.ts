import { readWorkbook } from "@/lib/xlsx-read";
import type { Sheet } from "@/lib/xlsx-read";
import { flaggedItems } from "@/lib/package-review";
import { checkPackage, extensionOf, readPackage } from "@/lib/package-read";
import type { PackageData, PackageFile, PartKind } from "@/lib/package-read";

/**
 * Reading ONE document (DESIGN.md: One document in, a draft topic out). The prototype reads the Excel
 * template: every sheet becomes the rows of the matching part, so the existing parser and the existing
 * checker do the rest. Document analysis is simulated: there is no live AI. Pure: the bytes come in,
 * the draft data and plain messages go out.
 */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export const MESSAGES = {
  type: "This file type is not supported. Use an Excel file (.xlsx).",
  size: "This file is too large (max 10 MB).",
  empty: "No content found in this file.",
  noGuide: "No Guide sheet found. Download the template to see the expected sheets.",
} as const;

/** The columns of each sheet of the template, as the names the package reader knows. */
const COLUMNS: Record<PartKind, Record<string, string>> = {
  topic: { title: "topic_title", summary: "topic_summary", "scenario title": "scenario_title" },
  guide: {
    "section number": "section",
    title: "title",
    text: "text",
    "image file": "image_file",
    "image description": "alt_text",
  },
  steps: {
    "step guide": "checklist_title",
    "step number": "step",
    action: "action",
    detail: "detail",
    section: "guide_reference",
    "image file": "image_file",
    "image description": "alt_text",
  },
  scenario: {
    step: "step",
    situation: "situation",
    question: "question",
    "option a": "option_a",
    "option b": "option_b",
    "option c": "option_c",
    "option d": "option_d",
    correct: "correct",
    why: "why",
    section: "guide_reference",
    "image file": "image_file",
    "image description": "alt_text",
  },
  questions: {
    question: "question",
    "option a": "option_a",
    "option b": "option_b",
    "option c": "option_c",
    "option d": "option_d",
    correct: "correct",
    why: "explanation",
    section: "guide_reference",
    "image file": "image_file",
    "image description": "alt_text",
  },
};

const quote = (cell: string) => (/[",\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell);
const norm = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

/** The first message that blocks Import for a file's name and size, or "" when both are fine. */
export function checkFile(name: string, size: number): string {
  if (extensionOf(name) !== "xlsx") return MESSAGES.type;
  if (size > MAX_DOCUMENT_BYTES) return MESSAGES.size;
  return "";
}

/** One sheet as the CSV of its part: the grey instruction row and empty rows are left out. */
function sheetFile(kind: PartKind, sheet: Sheet): PackageFile | null {
  const header = (sheet.rows[0] ?? []).map(norm);
  const map = COLUMNS[kind];
  const columns = header.map((label) => map[label]);
  if (!columns.some(Boolean)) return null;
  const known = columns.map((name, i) => ({ name, i })).filter((c) => c.name);
  const body = sheet.rows
    .slice(1)
    .filter((row) => row.some((cell) => cell !== "") && !/^instructions?\b/i.test(row[0] ?? ""));
  const names = known.map((c) => c.name!);
  const lines = body.map((row, n) => {
    const cells = known.map((c) => quote(row[c.i] ?? ""));
    return kind === "questions" ? [`Q${String(n + 1).padStart(3, "0")}`, ...cells] : cells;
  });
  const text = [kind === "questions" ? ["question_id", ...names] : names, ...lines]
    .map((line) => line.join(","))
    .join("\n");
  const file = `${kind}.csv`;
  return { name: file, size: text.length, text };
}

export type DocumentRead = {
  /** The CSV-shaped parts found, for the package reader. */
  files: PackageFile[];
  /** The parts that have at least one row. */
  present: PartKind[];
};

/** The parts of a workbook, or null when the bytes are not a workbook. */
export function readDocument(bytes: Uint8Array): DocumentRead | null {
  const sheets = readWorkbook(bytes);
  if (!sheets) return null;
  const files: PackageFile[] = [];
  const present: PartKind[] = [];
  for (const kind of ["topic", "guide", "steps", "scenario", "questions"] as const) {
    const sheet = sheets.find((s) => norm(s.name) === kind);
    const file = sheet ? sheetFile(kind, sheet) : null;
    if (!file) continue;
    files.push(file);
    if (file.text!.split("\n").length > 1) present.push(kind);
  }
  return { files, present };
}

/** What a chosen document blocks Import with ("" for nothing), or null when it cannot be opened. */
export function checkDocument(bytes: Uint8Array): string | null {
  const read = readDocument(bytes);
  if (!read) return null;
  if (read.present.length === 0) return MESSAGES.empty;
  return read.present.includes("guide") ? "" : MESSAGES.noGuide;
}

/** The result of the analysis: what was found, in numbers. */
export type Analysis = {
  data: PackageData;
  counts: { guide: number; steps: number; scenario: number; questions: number };
  /** Parts with nothing in them (never the guide: that is blocked before). */
  missing: Exclude<PartKind, "topic" | "guide">[];
  /** Items whose guide link is missing or wrong. */
  linkProblems: number;
  /** Everything the review would visit. */
  toReview: number;
};

export function analyse(read: DocumentRead, images: PackageFile[]): Analysis {
  const { data } = readPackage([...read.files, ...images]);
  const counts = {
    guide: data.guide?.length ?? 0,
    steps: data.steps?.reduce((n, list) => n + list.steps.length, 0) ?? 0,
    scenario: data.scenario?.length ?? 0,
    questions: data.questions?.length ?? 0,
  };
  const issues = checkPackage(data);
  return {
    data,
    counts,
    missing: (["steps", "scenario", "questions"] as const).filter((part) => counts[part] === 0),
    linkProblems: issues.filter((issue) => /guide/i.test(issue.reason) && issue.kind !== "note")
      .length,
    toReview: flaggedItems(issues).length,
  };
}

/** "steps", "steps and scenario" or "steps, scenario or questions" for the partial state. */
export function missingLine(missing: Analysis["missing"]): string {
  const words = missing.map((part) => (part === "scenario" ? "a scenario" : part));
  const list = words.length > 1 ? `${words.slice(0, -1).join(", ")} or ${words.at(-1)}` : words[0];
  return `We could not find ${list} in this document.`;
}
