import { useMemo } from "react";
import {
  emptyData,
  MAX_IMAGE_BYTES,
  MAX_PACKAGE_BYTES,
  LETTERS,
  extensionOf,
} from "@/lib/package-read";
import type {
  Checklist,
  GuideSection,
  Letter,
  PackageData,
  PackageImage,
  PackageQuestion,
  ScenarioStep,
  StepItem,
} from "@/lib/package-read";
import { createStore } from "@/lib/store";

/**
 * The demo topics of the Instructor (DESIGN.md: Instructor, content package import and demo topics).
 * CLIENT ONLY: kept in this browser under ONE shared key of their own, versioned and tolerant. A
 * demo topic is isolated: its code (N1, N2, ...) is not a built-in topic, nothing of it is written
 * to the progress, history, exam or Ask AI stores, and deleting it leaves no trace.
 */
export type PackageStatus = "draft" | "published";

export type DemoTopic = PackageData & {
  id: string;
  /** N1, N2, ... */
  code: string;
  status: PackageStatus;
  createdAt: number;
  editedAt: number;
  publishedAt?: number;
};

export const MAX_PACKAGES = 5;
export const NO_ROOM = "This device has no room left. Delete a demo topic or use smaller pictures.";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const str = (value: unknown, max = 4000) => (typeof value === "string" ? value.slice(0, max) : "");
const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0);
const letter = (value: unknown): Letter | null =>
  typeof value === "string" && (LETTERS as readonly string[]).includes(value)
    ? (value as Letter)
    : null;
const four = (value: unknown): [string, string, string, string] => {
  const list = Array.isArray(value) ? value : [];
  return [str(list[0], 300), str(list[1], 300), str(list[2], 300), str(list[3], 300)];
};
const list = <T>(value: unknown, clean: (entry: Record<string, unknown>) => T): T[] | null =>
  Array.isArray(value) ? value.slice(0, 100).flatMap((e) => (isObject(e) ? [clean(e)] : [])) : null;

const cleanStep = (e: Record<string, unknown>): StepItem => ({
  step: num(e.step),
  action: str(e.action, 300),
  detail: str(e.detail, 600),
  guideRef: str(e.guideRef, 8),
  ...(e.refAuto === true && { refAuto: true }),
  imageFile: str(e.imageFile, 120),
  alt: str(e.alt, 200),
});

function cleanImages(value: unknown): Record<string, PackageImage> {
  if (!isObject(value)) return {};
  const images: Record<string, PackageImage> = {};
  let total = 0;
  for (const [name, entry] of Object.entries(value).slice(0, 6)) {
    if (!isObject(entry) || typeof entry.data !== "string") continue;
    if (
      !entry.data.startsWith("data:image/") ||
      !["png", "jpg", "jpeg", "webp"].includes(extensionOf(name))
    )
      continue;
    const size = num(entry.size);
    if (size > MAX_IMAGE_BYTES || total + size > MAX_PACKAGE_BYTES) continue;
    images[name.slice(0, 120)] = { data: entry.data, size };
    total += size;
  }
  return images;
}

/** Whatever was saved, cleaned: a broken topic or item is dropped, nothing throws. */
export function cleanPackages(value: unknown): DemoTopic[] | null {
  if (!Array.isArray(value)) return null;
  const topics: DemoTopic[] = [];
  for (const entry of value) {
    if (!isObject(entry)) continue;
    const { id, code, title, status } = entry;
    if (typeof id !== "string" || id === "" || topics.some((t) => t.id === id)) continue;
    if (typeof code !== "string" || !/^N\d{1,3}$/.test(code)) continue;
    if (typeof title !== "string" || title.trim() === "") continue;
    const guide = list<GuideSection>(entry.guide, (e) => ({
      section: num(e.section),
      title: str(e.title, 200),
      text: str(e.text, 3000),
      imageFile: str(e.imageFile, 120),
      alt: str(e.alt, 200),
    }));
    const steps = list<Checklist>(entry.steps, (e) => ({
      title: str(e.title, 200),
      steps: list<StepItem>(e.steps, cleanStep) ?? [],
    }));
    const scenario = list<ScenarioStep>(entry.scenario, (e) => ({
      step: num(e.step),
      situation: str(e.situation, 600),
      question: str(e.question, 400),
      options: four(e.options),
      correct: letter(e.correct),
      why: str(e.why, 800),
      guideRef: str(e.guideRef, 8),
      ...(e.refAuto === true && { refAuto: true }),
      imageFile: str(e.imageFile, 120),
      alt: str(e.alt, 200),
    }));
    const questions = list<PackageQuestion>(entry.questions, (e) => ({
      id: str(e.id, 40),
      text: str(e.text, 600),
      options: four(e.options),
      correct: letter(e.correct),
      explanation: str(e.explanation, 800),
      guideRef: str(e.guideRef, 8),
      ...(e.refAuto === true && { refAuto: true }),
      imageFile: str(e.imageFile, 120),
      alt: str(e.alt, 200),
    }));
    topics.push({
      ...emptyData(),
      id,
      code,
      title: title.slice(0, 120),
      summary: str(entry.summary, 400),
      scenarioTitle: str(entry.scenarioTitle, 160),
      guide,
      steps,
      scenario,
      questions,
      images: cleanImages(entry.images),
      rejectedImages: [],
      status: status === "published" ? "published" : "draft",
      createdAt: num(entry.createdAt),
      editedAt: num(entry.editedAt),
      ...(typeof entry.publishedAt === "number" && { publishedAt: entry.publishedAt }),
    });
  }
  return topics.slice(0, MAX_PACKAGES);
}

const store = createStore<DemoTopic[]>("ast.demo-topics.v1", {
  shared: true,
  sanitize: cleanPackages,
});

export const readPackages = (): DemoTopic[] => cleanPackages(store.read()) ?? [];

/** The demo topics, "loading" until the browser has been read. */
export function usePackages(): DemoTopic[] | "loading" {
  const raw = store.useValue();
  return useMemo(() => (raw === "loading" ? "loading" : (cleanPackages(raw) ?? [])), [raw]);
}

/** Saves the list; false when the browser has no room (the change still shows for this visit). */
export const savePackages = (topics: DemoTopic[]): boolean =>
  store.write(topics.length === 0 ? null : topics);

/** The next free code: N1, N2, ... */
export function nextCode(topics: DemoTopic[]): string {
  const used = new Set(topics.map((t) => t.code));
  let n = 1;
  while (used.has(`N${n}`)) n += 1;
  return `N${n}`;
}

export const newPackageId = (now: number) => `pk${now.toString(36)}`;

export function addPackage(topic: DemoTopic): boolean {
  return savePackages([topic, ...readPackages()]);
}
export function updatePackage(id: string, change: (topic: DemoTopic) => DemoTopic): boolean {
  return savePackages(readPackages().map((t) => (t.id === id ? change(t) : t)));
}
export const removePackage = (id: string): boolean =>
  savePackages(readPackages().filter((t) => t.id !== id));

/** The topics students may see. */
export const publishedPackages = (topics: DemoTopic[]) =>
  topics.filter((t) => t.status === "published");

/** "today" or a date, for "Last edited today". */
export function editedText(at: number, now: number): string {
  const day = (ms: number) => new Date(ms).toDateString();
  return day(at) === day(now)
    ? "today"
    : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(at);
}

/** A new demo topic from what was read, as a draft; the code is the next free one. */
export function createTopic(
  data: PackageData,
  title: string,
  summary: string,
  now: number,
  existing: DemoTopic[],
): DemoTopic {
  return {
    ...data,
    title: title.trim().slice(0, 120),
    summary: summary.trim().slice(0, 400),
    rejectedImages: [],
    id: newPackageId(now),
    code: nextCode(existing),
    status: "draft",
    createdAt: now,
    editedAt: now,
  };
}

/** The same demo topic with new files read into it ("Replace files"): it stays a draft with its id and code. */
export function replaceFiles(
  topic: DemoTopic,
  data: PackageData,
  title: string,
  summary: string,
  now: number,
): DemoTopic {
  return {
    ...data,
    title: title.trim().slice(0, 120),
    summary: summary.trim().slice(0, 400),
    rejectedImages: [],
    id: topic.id,
    code: topic.code,
    status: "draft",
    createdAt: topic.createdAt,
    editedAt: now,
  };
}
