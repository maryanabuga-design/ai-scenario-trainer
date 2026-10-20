import { useMemo } from "react";
import { registerImportedResolver } from "@/lib/imported-registry";
import { LETTERS, MAX_IMAGE_BYTES, MAX_QUESTIONS, MAX_SETS } from "@/lib/content-import";
import type { ImportedQuestion, Letter } from "@/lib/content-import";
import type { Item } from "@/lib/items";
import { createStore } from "@/lib/store";

/**
 * The imported question sets of the Instructor (DESIGN.md: Instructor, Content). CLIENT ONLY: they
 * are kept in this browser under one shared key (the whole device, like the exams), versioned and
 * tolerant. Nothing is uploaded.
 */
export type SetStatus = "draft" | "published";

export type ContentSet = {
  id: string;
  title: string;
  /** The guide section the set is about (S1 to S10). */
  topic: string;
  status: SetStatus;
  source: "csv" | "sample";
  fileName: string;
  createdAt: number;
  publishedAt?: number;
  /** Rows left out because a file may have 100 questions at most. */
  dropped: number;
  questions: ImportedQuestion[];
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown, max = 2000) => (typeof value === "string" ? value.slice(0, max) : "");

function cleanQuestion(value: unknown): ImportedQuestion | null {
  if (!isObject(value) || typeof value.id !== "string" || value.id === "") return null;
  const options = Array.isArray(value.options) ? value.options : [];
  const letter = typeof value.correct === "string" ? value.correct : "";
  const image = isObject(value.image) ? value.image : null;
  const data = image && typeof image.data === "string" ? image.data : "";
  return {
    id: value.id,
    text: text(value.text),
    options: LETTERS.map((_, i) => text(options[i])) as ImportedQuestion["options"],
    correct: (LETTERS as readonly string[]).includes(letter) ? (letter as Letter) : null,
    explanation: text(value.explanation),
    guideRef: text(value.guideRef, 8),
    imageUrl: text(value.imageUrl),
    ...(data.startsWith("data:image/") && { image: { data, alt: text(image?.alt, 200) } }),
  };
}

/** Whatever was saved, cleaned: a broken set or question is dropped, nothing throws. */
export function cleanSets(value: unknown): ContentSet[] | null {
  if (!Array.isArray(value)) return null;
  const sets: ContentSet[] = [];
  for (const entry of value) {
    if (!isObject(entry)) continue;
    const { id, title, topic, status, source, fileName, createdAt, publishedAt, dropped } = entry;
    if (typeof id !== "string" || id === "" || sets.some((set) => set.id === id)) continue;
    if (typeof title !== "string" || title.trim() === "") continue;
    if (typeof topic !== "string" || !/^S([1-9]|10)$/.test(topic)) continue;
    const questions = (Array.isArray(entry.questions) ? entry.questions : [])
      .slice(0, MAX_QUESTIONS)
      .flatMap((q) => cleanQuestion(q) ?? []);
    sets.push({
      id,
      title: title.slice(0, 120),
      topic,
      status: status === "published" ? "published" : "draft",
      source: source === "sample" ? "sample" : "csv",
      fileName: text(fileName, 200),
      createdAt: typeof createdAt === "number" ? createdAt : 0,
      ...(typeof publishedAt === "number" && { publishedAt }),
      dropped: typeof dropped === "number" && dropped > 0 ? dropped : 0,
      questions,
    });
  }
  return sets.slice(0, MAX_SETS);
}

const store = createStore<ContentSet[]>("ast.content-sets.v1", {
  shared: true,
  sanitize: cleanSets,
});

export const readSets = (): ContentSet[] => cleanSets(store.read()) ?? [];

/** The sets, "loading" until the browser has been read. */
export function useContentSets(): ContentSet[] | "loading" {
  const raw = store.useValue();
  return useMemo(() => (raw === "loading" ? "loading" : (cleanSets(raw) ?? [])), [raw]);
}

/** Saves the list; false when the browser has no room (the change still shows for this visit). */
export const saveSets = (sets: ContentSet[]): boolean => store.write(sets);

export const NO_ROOM = "This device has no room left. Remove an image or a set.";

/** One set changed, the others kept. */
export function updateSet(id: string, change: (set: ContentSet) => ContentSet): boolean {
  return saveSets(readSets().map((set) => (set.id === id ? change(set) : set)));
}

export const addSet = (set: ContentSet): boolean => saveSets([set, ...readSets()]);

export const removeSet = (id: string): boolean => saveSets(readSets().filter((s) => s.id !== id));

/** The new id of a set: letters and digits only, so a question id has no confusing separators. */
export const newSetId = (now: number) => `c${now.toString(36)}`;

/** The image a data URL may be, by size: roughly 3/4 of its base64 text. */
export const imageBytes = (data: string) =>
  Math.floor(((data.length - data.indexOf(",") - 1) * 3) / 4);
export const imageFits = (data: string) => imageBytes(data) <= MAX_IMAGE_BYTES;

// ---- the Student side ----------------------------------------------------------------------------

/** The id of a question as a quiz item: it never collides with a bank id. */
export const itemIdOf = (question: ImportedQuestion) => `imp-${question.id}`;

/** A question of a set as the one item shape (3 or 4 options, one correct), marked as imported. */
export function toItem(set: ContentSet, question: ImportedQuestion): Item {
  const options = LETTERS.flatMap((letter, i) =>
    question.options[i] === "" ? [] : [{ id: letter, text: question.options[i] }],
  );
  return {
    id: itemIdOf(question),
    kind: "question",
    section: set.topic,
    question: question.text,
    options,
    correctOptionId: question.correct ?? "a",
    why: question.explanation,
    guideRef: [question.guideRef || set.topic],
    ...(question.image && { image: { src: question.image.data, alt: question.image.alt } }),
    imported: true,
  };
}

/** The questions of a Published set as items. */
export const itemsOf = (set: ContentSet): Item[] => set.questions.map((q) => toItem(set, q));

// found by id while a session, its results or its review are on screen; cached per saved text
let cache: { raw: string | null; items: Map<string, Item> } | null = null;
function lookup(id: string): Item | undefined {
  if (!id.startsWith("imp-")) return undefined;
  const raw = store.raw();
  if (!cache || cache.raw !== raw) {
    const items = new Map<string, Item>();
    readSets()
      .filter((set) => set.status === "published")
      .forEach((set) => itemsOf(set).forEach((item) => items.set(item.id, item)));
    cache = { raw, items };
  }
  return cache.items.get(id);
}
registerImportedResolver(lookup);
