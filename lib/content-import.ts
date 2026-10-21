import sample from "@/content/sample-import.json";

/**
 * Reading imported questions (DESIGN.md: Instructor, Content). PURE: no storage, no network, no
 * HTML. Everything read from a file is plain text; React escapes it when it is shown.
 */
export const MAX_FILE_BYTES = 1024 * 1024;
export const MAX_QUESTIONS = 100;
export const MAX_QUESTION_CHARS = 300;
export const MAX_OPTION_CHARS = 140;
export const MAX_IMAGE_BYTES = 300 * 1024;
export const MAX_SETS = 30;

export const LETTERS = ["a", "b", "c", "d"] as const;
export type Letter = (typeof LETTERS)[number];

export type ImportedQuestion = {
  /** Stable inside the set; never reused. */
  id: string;
  text: string;
  /** The answers A to D; an empty string is an unused answer. */
  options: [string, string, string, string];
  /** The letter of the correct answer, or null when there is none. */
  correct: Letter | null;
  explanation: string;
  /** A guide section of the topic, or "". */
  guideRef: string;
  /** The image_url column of the file: kept as text, never loaded (no network). */
  imageUrl: string;
  /** A picture added by the instructor, as a data URL, with its alt text. */
  image?: { data: string; alt: string };
};

// ---- the file --------------------------------------------------------------------------------

export const MAX_CSV_BYTES = MAX_FILE_BYTES;
export const MAX_OTHER_BYTES = 5 * 1024 * 1024;

export const FILE_TYPES = ["csv", "xlsx", "docx", "pdf"] as const;
export type FileType = (typeof FILE_TYPES)[number];

export const extensionOf = (name: string): string => {
  const dot = name.lastIndexOf(".");
  return dot < 0 ? "" : name.slice(dot + 1).toLowerCase();
};

export const fileTypeOf = (name: string): FileType | null => {
  const ext = extensionOf(name);
  return (FILE_TYPES as readonly string[]).includes(ext) ? (ext as FileType) : null;
};

/** Only a CSV file is really read; the other types show the prepared sample result. */
export const isRead = (name: string) => fileTypeOf(name) === "csv";

/** The file name without its extension: the title the Import screen starts with. */
export function titleFromFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name).trim();
  return base.slice(0, 120);
}

/** "1.2 MB", "34 KB" or "120 bytes". */
export function sizeText(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} bytes`;
}

/** The message for a file that cannot be used, or null when its name and size are fine. */
export function checkFile(file: { name: string; size: number }): string | null {
  const type = fileTypeOf(file.name);
  if (type === null) return "Choose a CSV, Excel, Word or PDF file.";
  if (file.size === 0) return "The file is empty.";
  if (type === "csv" && file.size > MAX_CSV_BYTES) return "A CSV file may be up to 1 MB.";
  if (file.size > MAX_OTHER_BYTES) return "The file is larger than 5 MB.";
  return null;
}

// ---- CSV -------------------------------------------------------------------------------------

/** The delimiter of a CSV text, found on its first line outside quotes: ";" when it has more than ",". */
export function detectDelimiter(text: string): "," | ";" {
  let commas = 0;
  let semicolons = 0;
  let quoted = false;
  for (const char of text) {
    if (char === '"') quoted = !quoted;
    else if (!quoted && (char === "\n" || char === "\r")) break;
    else if (!quoted && char === ",") commas += 1;
    else if (!quoted && char === ";") semicolons += 1;
  }
  return semicolons > commas ? ";" : ",";
}

/** The cells of a CSV text: quoted cells, doubled quotes and line breaks inside quotes; empty lines are dropped. */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const endRow = () => {
    row.push(cell);
    cell = "";
    if (row.some((value) => value.trim() !== "")) rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      endRow();
    } else cell += char;
  }
  if (cell !== "" || row.length > 0) endRow();
  return rows;
}

const normaliseHeader = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

export type ReadResult =
  { ok: true; questions: ImportedQuestion[]; dropped: number } | { ok: false; error: string };

const clean = (value: string | undefined) => (value ?? "").trim();

/** Turns the text of a CSV file into questions (a set id makes the question ids). */
export function readCsv(text: string, setId: string): ReadResult {
  if (text.replace(/^﻿/, "").trim() === "") return { ok: false, error: "The file is empty." };
  const rows = parseCsv(text);
  const header = rows[0]?.map(normaliseHeader) ?? [];
  const at = (name: string) => header.indexOf(name);
  if (at("question") < 0) {
    return { ok: false, error: "No question column found. Use the CSV template." };
  }
  const body = rows.slice(1);
  if (body.length === 0) return { ok: false, error: "No questions found in the file." };
  const kept = body.slice(0, MAX_QUESTIONS);
  const cell = (row: string[], name: string) => (at(name) < 0 ? "" : clean(row[at(name)]));
  const questions = kept.map((row, index): ImportedQuestion => {
    const letter = cell(row, "correct").toLowerCase();
    return {
      id: `${setId}-${index + 1}`,
      text: cell(row, "question"),
      options: LETTERS.map((l) => cell(row, `option_${l}`)) as ImportedQuestion["options"],
      correct: (LETTERS as readonly string[]).includes(letter) ? (letter as Letter) : null,
      explanation: cell(row, "explanation"),
      guideRef: cell(row, "guide_reference"),
      imageUrl: cell(row, "image_url"),
    };
  });
  return { ok: true, questions, dropped: body.length - kept.length };
}

/** A guide topic id written in a CSV cell ("S3", "s3" or "S3 Moving through smoke"), or null. */
const topicOfCell = (cell: string): string | null => {
  const match = /^s(10|[1-9])\b/i.exec(cell.trim());
  return match ? `S${match[1]}` : null;
};

/** The topic named in a CSV's topic column: the most frequent valid one (the first wins a tie), or null. */
export function detectTopic(text: string): string | null {
  const rows = parseCsv(text);
  const column = (rows[0] ?? []).map(normaliseHeader).indexOf("topic");
  if (column < 0) return null;
  const counts = new Map<string, number>();
  for (const row of rows.slice(1)) {
    const topic = topicOfCell(row[column] ?? "");
    if (topic) counts.set(topic, (counts.get(topic) ?? 0) + 1);
  }
  let best: string | null = null;
  for (const [topic, n] of counts) if (best === null || n > counts.get(best)!) best = topic;
  return best;
}

// ---- the sample for Word files ----------------------------------------------------------------

export const SAMPLE_LABEL = "Sample result. This file type is not read in this prototype.";

/** The prepared sample set shown for a Word file (20 questions, 2 of them flagged). */
export function sampleQuestions(setId: string): ImportedQuestion[] {
  return sample.questions.map((entry, index) => {
    const letter = entry.correct.toLowerCase();
    return {
      id: `${setId}-${index + 1}`,
      text: entry.text,
      options: LETTERS.map((_, i) => entry.options[i] ?? "") as ImportedQuestion["options"],
      correct: (LETTERS as readonly string[]).includes(letter) ? (letter as Letter) : null,
      explanation: entry.explanation,
      guideRef: entry.guideRef,
      imageUrl: "",
    };
  });
}

// ---- flags -----------------------------------------------------------------------------------

const normalise = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();
const filled = (question: ImportedQuestion) =>
  question.options
    .map((text, index) => ({ letter: LETTERS[index], text }))
    .filter((o) => o.text !== "");

/** Why a question needs attention, in the order the checks run; empty when it is Ready. */
export function problemsOf(question: ImportedQuestion, all: ImportedQuestion[]): string[] {
  const problems: string[] = [];
  const options = filled(question);
  if (question.text.trim() === "") problems.push("No question text");
  if (options.length < 2) problems.push("Fewer than 2 answers");
  if (question.correct === null) problems.push("No correct answer");
  else if (!options.some((o) => o.letter === question.correct)) {
    problems.push(`Correct answer ${question.correct.toUpperCase()} has no text`);
  }
  const key = normalise(question.text);
  if (
    key !== "" &&
    all.findIndex((other) => normalise(other.text) === key) < all.indexOf(question)
  ) {
    problems.push("Duplicate of an earlier question");
  }
  if (question.text.length > MAX_QUESTION_CHARS) {
    problems.push(`Question is longer than ${MAX_QUESTION_CHARS} characters`);
  }
  if (options.some((o) => o.text.length > MAX_OPTION_CHARS)) {
    problems.push(`An answer is longer than ${MAX_OPTION_CHARS} characters`);
  }
  if (question.explanation.trim() === "") problems.push("No explanation");
  if (question.image && question.image.alt.trim() === "") problems.push("Image has no alt text");
  return problems;
}

export type ReviewCounts = { ready: number; attention: number; total: number };

export function reviewCounts(questions: ImportedQuestion[]): ReviewCounts {
  const attention = questions.filter((q) => problemsOf(q, questions).length > 0).length;
  return { ready: questions.length - attention, attention, total: questions.length };
}

/** "Fix 2 questions to publish" while some need attention, "" otherwise. */
export function publishHint(counts: ReviewCounts): string {
  if (counts.total === 0) return "Add questions to publish";
  if (counts.attention === 0) return "";
  return `Fix ${counts.attention} ${counts.attention === 1 ? "question" : "questions"} to publish`;
}

export const canPublish = (counts: ReviewCounts) => counts.total > 0 && counts.attention === 0;
