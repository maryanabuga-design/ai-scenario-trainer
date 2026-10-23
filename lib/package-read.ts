import { parseCsv } from "@/lib/content-import";

/**
 * Reading a content package (DESIGN.md: Instructor, content package import and demo topics). PURE:
 * no storage, no network, no HTML. The files arrive as text or data URLs (read on this device);
 * everything read is plain text and React escapes it when it is shown. The module never imports
 * anything of the built-in content, readiness, exams or Ask AI: a package is isolated.
 */
export const PART_KINDS = ["topic", "guide", "steps", "scenario", "questions"] as const;
export type PartKind = (typeof PART_KINDS)[number];

export const PART_LABELS: Record<PartKind, string> = {
  topic: "Topic",
  guide: "Guide",
  steps: "Steps",
  scenario: "Scenario",
  questions: "Questions",
};

export const MAX_ROWS = 100;
export const MAX_CSV_BYTES = 1024 * 1024;
export const MAX_IMAGE_BYTES = 300 * 1024;
export const MAX_IMAGES = 6;
export const MAX_PACKAGE_BYTES = 1.5 * 1024 * 1024;
export const GUIDE_TEXT_MAX = 1200;
export const STEPS_MAX = 10;
export const QUESTION_MAX = 300;
export const OPTION_MAX = 140;
export const LETTERS = ["a", "b", "c", "d"] as const;
export type Letter = (typeof LETTERS)[number];

/** The columns that identify each type of file (the header row, case-insensitive). */
const HEADERS: Record<PartKind, string[]> = {
  topic: ["topic_title", "topic_summary", "scenario_title"],
  guide: ["section", "title", "text", "image_file", "alt_text"],
  steps: [
    "checklist_title",
    "step",
    "action",
    "detail",
    "guide_reference",
    "image_file",
    "alt_text",
  ],
  scenario: [
    "step",
    "situation",
    "question",
    "option_a",
    "option_b",
    "option_c",
    "option_d",
    "correct",
    "why",
    "guide_reference",
    "image_file",
    "alt_text",
  ],
  questions: [
    "question_id",
    "question",
    "option_a",
    "option_b",
    "option_c",
    "option_d",
    "correct",
    "explanation",
    "guide_reference",
    "image_file",
    "alt_text",
  ],
};

// ---- the model -------------------------------------------------------------------------------

export type GuideSection = {
  /** The number written in the file (0 when it is not a number). */
  section: number;
  title: string;
  text: string;
  imageFile: string;
  alt: string;
};
export type StepItem = {
  step: number;
  action: string;
  detail: string;
  guideRef: string;
  imageFile: string;
  alt: string;
};
export type Checklist = { title: string; steps: StepItem[] };
export type ScenarioStep = {
  step: number;
  situation: string;
  question: string;
  options: [string, string, string, string];
  correct: Letter | null;
  why: string;
  guideRef: string;
  imageFile: string;
  alt: string;
};
export type PackageQuestion = {
  id: string;
  text: string;
  options: [string, string, string, string];
  correct: Letter | null;
  explanation: string;
  guideRef: string;
  imageFile: string;
  alt: string;
};
export type PackageImage = { data: string; size: number };

export type PackageData = {
  title: string;
  summary: string;
  scenarioTitle: string;
  guide: GuideSection[] | null;
  steps: Checklist[] | null;
  scenario: ScenarioStep[] | null;
  questions: PackageQuestion[] | null;
  /** The selected pictures, by file name. */
  images: Record<string, PackageImage>;
  /** Pictures that were chosen but not kept (too big, too many), by file name. */
  rejectedImages: { name: string; reason: string }[];
};

export const emptyData = (): PackageData => ({
  title: "",
  summary: "",
  scenarioTitle: "",
  guide: null,
  steps: null,
  scenario: null,
  questions: null,
  images: {},
  rejectedImages: [],
});

// ---- the files -------------------------------------------------------------------------------

export type PackageFile = {
  name: string;
  size: number;
  /** The text of a CSV file. */
  text?: string;
  /** A picture as a data URL. */
  dataUrl?: string;
};

export const extensionOf = (name: string) => {
  const dot = name.lastIndexOf(".");
  return dot < 0 ? "" : name.slice(dot + 1).toLowerCase();
};
export const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];
export const fileKind = (name: string): "csv" | "image" | null =>
  extensionOf(name) === "csv"
    ? "csv"
    : IMAGE_EXTENSIONS.includes(extensionOf(name))
      ? "image"
      : null;

const norm = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/^﻿/, "")
    .replace(/[\s-]+/g, "_");

/** Which part a CSV is, from its header row alone (the file name does not matter); null when it is none of the five. */
export function detectKind(header: string[]): PartKind | null {
  const names = new Set(header.map(norm));
  // the more specific types first: scenario and steps share columns with the others
  const order: PartKind[] = ["topic", "scenario", "questions", "steps", "guide"];
  return (
    order.find((kind) => {
      const required = {
        topic: ["topic_title"],
        scenario: ["situation", "step", "question"],
        questions: ["question_id", "question"],
        steps: ["checklist_title", "step", "action"],
        guide: ["section", "title", "text"],
      }[kind];
      return required.every((column) => names.has(column));
    }) ?? null
  );
}

/** The columns a CSV of this type has, for the templates. */
export const columnsOf = (kind: PartKind) => HEADERS[kind];

const text = (value: string | undefined) => (value ?? "").trim();
const toNumber = (value: string) => (/^\d+$/.test(value.trim()) ? Number(value.trim()) : 0);
const toLetter = (value: string): Letter | null => {
  const letter = value.trim().toLowerCase();
  return (LETTERS as readonly string[]).includes(letter) ? (letter as Letter) : null;
};

type Row = (name: string) => string;
function rowsOf(csv: string[][]): { header: string[]; rows: Row[]; extra: number } {
  const header = (csv[0] ?? []).map(norm);
  const body = csv.slice(1);
  const kept = body.slice(0, MAX_ROWS);
  return {
    header,
    extra: body.length - kept.length,
    rows: kept.map((cells) => (name: string) => {
      const index = header.indexOf(name);
      return index < 0 ? "" : text(cells[index]);
    }),
  };
}

export type Recognised = {
  /** The part, or "images". */
  part: PartKind | "images";
  /** "Guide · 4 sections". */
  label: string;
  /** The file it came from (not for the pictures). */
  fileName?: string;
};

export type ReadOutcome = {
  data: PackageData;
  recognised: Recognised[];
  /** Amber messages: files that could not be used, rows left out. */
  messages: string[];
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The text of a recognised row: "Guide · 4 sections", "Steps · 2 step guides, 7 steps", ... */
export function labelOf(kind: PartKind, data: PackageData): string {
  const name = PART_LABELS[kind];
  if (kind === "topic") return `${name} · ${data.title || "no title"}`;
  if (kind === "guide")
    return `${name} · ${plural(data.guide?.length ?? 0, "section", "sections")}`;
  if (kind === "steps") {
    const lists = data.steps ?? [];
    return `${name} · ${plural(lists.length, "step guide", "step guides")}, ${plural(
      lists.reduce((n, list) => n + list.steps.length, 0),
      "step",
      "steps",
    )}`;
  }
  if (kind === "scenario")
    return `${name} · ${plural(data.scenario?.length ?? 0, "step", "steps")}`;
  return `${name} · ${plural(data.questions?.length ?? 0, "question", "questions")}`;
}

/** Every picture file name a package refers to, in the order of the parts. */
export function referencedImages(data: PackageData): string[] {
  const names: string[] = [];
  const add = (name: string) => name !== "" && names.push(name);
  data.guide?.forEach((s) => add(s.imageFile));
  data.steps?.forEach((list) => list.steps.forEach((s) => add(s.imageFile)));
  data.scenario?.forEach((s) => add(s.imageFile));
  data.questions?.forEach((q) => add(q.imageFile));
  return names;
}

/** The picture of a file name (the name is matched without regard to case), or undefined. */
export function findImage(
  data: Pick<PackageData, "images">,
  name: string,
): PackageImage | undefined {
  if (name === "") return undefined;
  const key = Object.keys(data.images).find((k) => k.toLowerCase() === name.trim().toLowerCase());
  return key === undefined ? undefined : data.images[key];
}

const UNKNOWN_FILE = "is not a CSV file or a png, jpg or webp picture, so it was left out.";

/**
 * Reads the chosen files together (the order does not matter): pictures are kept within the budget,
 * CSV files are told apart by their header row, a second file of one type is ignored with a
 * message. A package may hold any subset of the four parts.
 */
/** The part a CSV file is, from its header row (null for pictures and files that do not match). */
export function csvPart(file: PackageFile): PartKind | null {
  if (fileKind(file.name) !== "csv" || file.text === undefined) return null;
  const csv = parseCsv(file.text);
  return csv.length === 0 ? null : detectKind(csv[0]);
}

export function readPackage(files: PackageFile[]): ReadOutcome {
  const data = emptyData();
  const recognised: Recognised[] = [];
  const messages: string[] = [];
  const seen = new Set<PartKind>();
  let imageBytes = 0;
  let imageCount = 0;

  // pictures first, so the budget is spent in the order the files were chosen
  for (const file of files) {
    if (fileKind(file.name) !== "image") continue;
    if (file.size > MAX_IMAGE_BYTES) {
      const reason = `${file.name} is larger than 300 KB.`;
      data.rejectedImages.push({ name: file.name, reason });
      messages.push(reason);
    } else if (imageCount >= MAX_IMAGES) {
      const reason = `${file.name} was left out: a package may hold ${MAX_IMAGES} images at most.`;
      data.rejectedImages.push({ name: file.name, reason });
      messages.push(reason);
    } else if (imageBytes + file.size > MAX_PACKAGE_BYTES || !file.dataUrl) {
      const reason = `${file.name} was left out: the package would be larger than 1.5 MB.`;
      data.rejectedImages.push({ name: file.name, reason });
      messages.push(reason);
    } else {
      data.images[file.name] = { data: file.dataUrl, size: file.size };
      imageBytes += file.size;
      imageCount += 1;
    }
  }

  for (const file of files) {
    const kind = fileKind(file.name);
    if (kind === null) {
      messages.push(`${file.name} ${UNKNOWN_FILE}`);
      continue;
    }
    if (kind === "image") continue;
    if (file.size > MAX_CSV_BYTES) {
      messages.push(`${file.name} is larger than 1 MB.`);
      continue;
    }
    const csv = parseCsv(file.text ?? "");
    if (csv.length === 0) {
      messages.push(`${file.name} is empty.`);
      continue;
    }
    const part = detectKind(csv[0]);
    if (part === null) {
      messages.push(
        `${file.name}: the first row does not match a topic, guide, steps, scenario or questions file.`,
      );
      continue;
    }
    if (seen.has(part)) {
      messages.push(
        `Two ${PART_LABELS[part].toLowerCase()} files were chosen. ${file.name} was left out.`,
      );
      continue;
    }
    seen.add(part);
    const { rows, extra } = rowsOf(csv);
    if (extra > 0) {
      messages.push(
        `${file.name}: only the first ${MAX_ROWS} rows are read (${plural(extra, "row", "rows")} left out).`,
      );
    }
    if (part === "topic") {
      const row = rows[0];
      data.title = row?.("topic_title") ?? "";
      data.summary = row?.("topic_summary") ?? "";
      data.scenarioTitle = row?.("scenario_title") ?? "";
    } else if (part === "guide") {
      data.guide = rows.map((row) => ({
        section: toNumber(row("section")),
        title: row("title"),
        text: row("text"),
        imageFile: row("image_file"),
        alt: row("alt_text"),
      }));
    } else if (part === "steps") {
      const lists: Checklist[] = [];
      for (const row of rows) {
        const title = row("checklist_title");
        let list = lists.find((entry) => entry.title === title);
        if (!list) {
          list = { title, steps: [] };
          lists.push(list);
        }
        list.steps.push({
          step: toNumber(row("step")),
          action: row("action"),
          detail: row("detail"),
          guideRef: row("guide_reference"),
          imageFile: row("image_file"),
          alt: row("alt_text"),
        });
      }
      data.steps = lists;
    } else if (part === "scenario") {
      data.scenario = rows.map((row) => ({
        step: toNumber(row("step")),
        situation: row("situation"),
        question: row("question"),
        options: LETTERS.map((l) => row(`option_${l}`)) as ScenarioStep["options"],
        correct: toLetter(row("correct")),
        why: row("why"),
        guideRef: row("guide_reference"),
        imageFile: row("image_file"),
        alt: row("alt_text"),
      }));
    } else {
      data.questions = rows.map((row, index) => ({
        id: row("question_id") || `Q${String(index + 1).padStart(3, "0")}`,
        text: row("question"),
        options: LETTERS.map((l) => row(`option_${l}`)) as PackageQuestion["options"],
        correct: toLetter(row("correct")),
        explanation: row("explanation"),
        guideRef: row("guide_reference"),
        imageFile: row("image_file"),
        alt: row("alt_text"),
      }));
    }
    recognised.push({ part, label: "", fileName: file.name });
  }

  for (const entry of recognised) {
    entry.label = labelOf(entry.part as PartKind, data);
  }
  // keep the learning path order, then the pictures
  const orderOf = (kind: PartKind | "images") =>
    kind === "images"
      ? 9
      : (["topic", "guide", "steps", "scenario", "questions"] as const).indexOf(kind);
  recognised.sort((a, b) => orderOf(a.part) - orderOf(b.part));
  return { data, recognised, messages };
}

/** "Images · 2 of 2 found": the pictures the package names against those that were chosen. */
export function imagesLabel(data: PackageData): string | null {
  const named = [...new Set(referencedImages(data).map((n) => n.toLowerCase()))];
  const chosen = Object.keys(data.images).length;
  if (named.length === 0 && chosen === 0) return null;
  const found = named.filter((n) => findImage(data, n)).length;
  return named.length === 0
    ? `Images · ${plural(chosen, "picture", "pictures")}`
    : `Images · ${found} of ${named.length} found`;
}

/** The picture names the package mentions that were not selected, each once, in the order they appear. */
export function missingImages(data: PackageData): string[] {
  const seen = new Set<string>();
  return referencedImages(data).filter((name) => {
    const key = name.toLowerCase();
    if (seen.has(key) || findImage(data, name) !== undefined) return false;
    seen.add(key);
    return true;
  });
}

// ---- the checks ------------------------------------------------------------------------------

export type IssuePart = PartKind | "images";
export type Issue = {
  id: string;
  part: IssuePart;
  /** The row: "Q004", "Section 3", "When the alarm sounds, step 2". */
  where: string;
  reason: string;
  /** To fix (blocks Preview and Publish); false for the informational notes. */
  blocking: boolean;
  /** Where the fix is made: in the question editor, or in the files (then they are replaced). */
  fix: "edit" | "files";
  /** Which item it belongs to, e.g. "questions:3", so a tab can flag it. */
  key: string;
};

const normText = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();
const filledOptions = (options: string[]) =>
  options.map((o, i) => ({ letter: LETTERS[i], text: o })).filter((o) => o.text !== "");

/** Whether a guide reference points at a section of the package guide. */
export const refExists = (data: PackageData, ref: string) =>
  (data.guide ?? []).some((s) => s.section > 0 && String(s.section) === ref.trim());

/**
 * Every problem of a package, part by part (the rules are in DESIGN.md). Each is "Needs attention"
 * and blocks Publish, except the two informational notes (a guide section nothing uses, a picture
 * nothing uses). Without a guide the link checks are skipped.
 */
export function checkPackage(data: PackageData): Issue[] {
  const issues: Issue[] = [];
  const add = (part: IssuePart, key: string, where: string, reason: string, blocking = true) =>
    issues.push({
      id: `${key}:${issues.length}`,
      part,
      where,
      reason,
      blocking,
      key,
      // a question's text, answers, explanation and guide link are fixed in the editor; anything
      // about a picture, and every other part, is fixed in the files
      fix: part === "questions" && !/^Image |picture|larger than/.test(reason) ? "edit" : "files",
    });
  const hasGuide = data.guide !== null && data.guide.length > 0;

  const image = (part: IssuePart, key: string, where: string, file: string, alt: string) => {
    if (file === "") return;
    if (!IMAGE_EXTENSIONS.includes(extensionOf(file))) {
      add(part, key, where, `${file} is not a png, jpg or webp picture`);
      return;
    }
    if (findImage(data, file) === undefined) {
      const rejected = data.rejectedImages.find((r) => r.name.toLowerCase() === file.toLowerCase());
      add(
        part,
        key,
        where,
        rejected ? `${file} is larger than 300 KB` : `Image ${file} was not selected`,
      );
      return;
    }
    if (alt === "") add(part, key, where, `Image ${file} has no alt text`);
  };
  const link = (part: IssuePart, key: string, where: string, ref: string) => {
    if (!hasGuide) return;
    if (ref.trim() === "") add(part, key, where, "Not linked to the guide");
    else if (!refExists(data, ref))
      add(part, key, where, `Guide section ${ref.trim()} does not exist`);
  };
  const consecutive = (numbers: number[]) => numbers.every((n, i) => n === i + 1);

  // a topic file without a title is not an issue of the package: the title is required in the import form

  data.guide?.forEach((section, i) => {
    const where = `Section ${section.section || i + 1}`;
    const key = `guide:${i}`;
    if (section.title === "") add("guide", key, where, "No title");
    if (section.text === "") add("guide", key, where, "No text");
    if (section.text.length > GUIDE_TEXT_MAX) {
      add("guide", key, where, `Text is longer than ${GUIDE_TEXT_MAX} characters`);
    }
    image("guide", key, where, section.imageFile, section.alt);
  });
  if (data.guide && !consecutive(data.guide.map((s) => s.section))) {
    add("guide", "guide:all", "Guide", "Section numbers are not consecutive from 1");
  }

  data.steps?.forEach((list, li) => {
    if (list.steps.length > STEPS_MAX) {
      add("steps", `steps:${li}:all`, list.title, `More than ${STEPS_MAX} steps`);
    }
    if (!consecutive(list.steps.map((s) => s.step))) {
      add("steps", `steps:${li}:all`, list.title, "Step numbers are not consecutive from 1");
    }
    list.steps.forEach((step, si) => {
      const where = `${list.title}, step ${step.step || si + 1}`;
      const key = `steps:${li}:${si}`;
      if (step.action === "") add("steps", key, where, "No action");
      link("steps", key, where, step.guideRef);
      image("steps", key, where, step.imageFile, step.alt);
    });
  });

  if (data.scenario) {
    if (data.scenario.length > STEPS_MAX) {
      add("scenario", "scenario:all", "Scenario", `More than ${STEPS_MAX} steps`);
    }
    if (!consecutive(data.scenario.map((s) => s.step))) {
      add("scenario", "scenario:all", "Scenario", "Step numbers are not consecutive from 1");
    }
  }
  data.scenario?.forEach((step, i) => {
    const where = `Scenario step ${step.step || i + 1}`;
    const key = `scenario:${i}`;
    if (step.situation === "") add("scenario", key, where, "No situation");
    if (step.question === "") add("scenario", key, where, "No question");
    const options = filledOptions(step.options);
    if (options.length < 2) add("scenario", key, where, "Fewer than 2 answers");
    if (step.correct === null) add("scenario", key, where, "No correct answer");
    else if (!options.some((o) => o.letter === step.correct)) {
      add("scenario", key, where, `Correct answer ${step.correct.toUpperCase()} has no text`);
    }
    if (step.why === "") add("scenario", key, where, "No explanation (why)");
    link("scenario", key, where, step.guideRef);
    image("scenario", key, where, step.imageFile, step.alt);
  });

  data.questions?.forEach((question, i) => {
    const where = question.id;
    const key = `questions:${i}`;
    const all = data.questions!;
    if (question.text === "") add("questions", key, where, "No question text");
    const options = filledOptions(question.options);
    if (options.length < 2) add("questions", key, where, "Fewer than 2 answers");
    if (question.correct === null) add("questions", key, where, "No correct answer");
    else if (!options.some((o) => o.letter === question.correct)) {
      add("questions", key, where, `Correct answer ${question.correct.toUpperCase()} has no text`);
    }
    const same = normText(question.text);
    if (same !== "" && all.findIndex((q) => normText(q.text) === same) < i) {
      add("questions", key, where, "Duplicate of an earlier question");
    }
    if (question.text.length > QUESTION_MAX) {
      add("questions", key, where, `Question is longer than ${QUESTION_MAX} characters`);
    }
    if (options.some((o) => o.text.length > OPTION_MAX)) {
      add("questions", key, where, `An answer is longer than ${OPTION_MAX} characters`);
    }
    if (question.explanation === "") add("questions", key, where, "No explanation");
    link("questions", key, where, question.guideRef);
    image("questions", key, where, question.imageFile, question.alt);
  });

  // informational notes: a section nothing uses, a picture nothing uses
  if (hasGuide) {
    for (const row of coverage(data).sections) {
      if (row.total === 0) {
        add(
          "guide",
          `guide:${row.index}`,
          `Section ${row.section}`,
          `Section ${row.section} is not used by any item`,
          false,
        );
      }
    }
  }
  const named = new Set(referencedImages(data).map((n) => n.toLowerCase()));
  for (const name of Object.keys(data.images)) {
    if (!named.has(name.toLowerCase())) {
      add("images", `images:${name}`, name, `Image ${name} is not used by any item`, false);
    }
  }
  return issues;
}

export const blockingIssues = (issues: Issue[]) => issues.filter((issue) => issue.blocking);

// ---- coverage --------------------------------------------------------------------------------

export type SectionUse = {
  index: number;
  section: number;
  title: string;
  steps: number;
  scenario: number;
  questions: number;
  total: number;
};

/** For each guide section, how many steps, scenario steps and questions rely on it. */
export function coverage(data: PackageData): {
  sections: SectionUse[];
  used: number;
  total: number;
} {
  const sections = (data.guide ?? []).map((section, index): SectionUse => {
    const ref = String(section.section);
    const steps = (data.steps ?? []).reduce(
      (n, list) => n + list.steps.filter((s) => s.guideRef.trim() === ref).length,
      0,
    );
    const scenario = (data.scenario ?? []).filter((s) => s.guideRef.trim() === ref).length;
    const questions = (data.questions ?? []).filter((q) => q.guideRef.trim() === ref).length;
    return {
      index,
      section: section.section,
      title: section.title,
      steps,
      scenario,
      questions,
      total: steps + scenario + questions,
    };
  });
  return { sections, used: sections.filter((s) => s.total > 0).length, total: sections.length };
}

/** "Used by 1 step, 1 scenario step, 3 questions" or "Not used by any item yet". */
export function usedByText(use: SectionUse): string {
  if (use.total === 0) return "Not used by any item yet";
  const parts = [
    use.steps > 0 ? plural(use.steps, "step", "steps") : "",
    use.scenario > 0 ? plural(use.scenario, "scenario step", "scenario steps") : "",
    use.questions > 0 ? plural(use.questions, "question", "questions") : "",
  ].filter(Boolean);
  return `Used by ${parts.join(", ")}`;
}

/** "Guide sections used: 4 of 4", or null without a guide. */
export const coverageLine = (data: PackageData): string | null => {
  const { used, total } = coverage(data);
  return total === 0 ? null : `Guide sections used: ${used} of ${total}`;
};

/** The parts a package has, in the learning path order. */
export const LEARNING_PATH = ["guide", "steps", "scenario", "quiz"] as const;
export type PathPart = (typeof LEARNING_PATH)[number];

export const isPathPart = (value: string): value is PathPart =>
  (LEARNING_PATH as readonly string[]).includes(value);

export function partsOf(data: PackageData): PathPart[] {
  const present: Record<PathPart, boolean> = {
    guide: !!data.guide && data.guide.length > 0,
    steps: !!data.steps && data.steps.length > 0,
    scenario: !!data.scenario && data.scenario.length > 0,
    quiz: !!data.questions && data.questions.length > 0,
  };
  return LEARNING_PATH.filter((part) => present[part]);
}

/** "Guide · Steps · Scenario · 10 questions" for the parts present. */
export function partsLine(data: PackageData): string {
  return partsOf(data)
    .map((part) =>
      part === "quiz"
        ? plural(data.questions?.length ?? 0, "question", "questions")
        : part[0].toUpperCase() + part.slice(1),
    )
    .join(" · ");
}

/** The tab an issue belongs to (the questions are the Quiz tab; image notes follow their item). */
export const tabOfIssue = (issue: Issue): PathPart | null =>
  issue.part === "questions"
    ? "quiz"
    : issue.part === "guide" || issue.part === "steps" || issue.part === "scenario"
      ? issue.part
      : null;

/** The issues to fix in the order "Show next issue" visits them: Guide, Steps, Scenario, Quiz; items in order. */
export function orderedIssues(issues: Issue[]): Issue[] {
  const rank = (issue: Issue) => {
    const tab = tabOfIssue(issue);
    return tab === null ? 4 : LEARNING_PATH.indexOf(tab);
  };
  return issues
    .filter((issue) => issue.blocking)
    .map((issue, index) => ({ issue, index }))
    .sort((a, b) => rank(a.issue) - rank(b.issue) || a.index - b.index)
    .map((entry) => entry.issue);
}

/** A long file name with the middle left out so the end (the extension) stays: "assembly-p…nt.png". */
export function shortName(name: string, max = 26): string {
  if (name.length <= max) return name;
  const keep = max - 1;
  const tail = Math.ceil(keep / 2.5);
  return `${name.slice(0, keep - tail)}…${name.slice(name.length - tail)}`;
}

/** The issue "Show next issue" visits after the one with this id (the first when none): in order, wrapping around. */
export function nextIssue(issues: Issue[], afterId: string | null): Issue | null {
  const list = orderedIssues(issues);
  if (list.length === 0) return null;
  const at = afterId === null ? -1 : list.findIndex((issue) => issue.id === afterId);
  return list[(at + 1) % list.length];
}

/** "Fix these in your files: Steps, step 3: Guide section 7 does not exist; ..." for the reopened import. */
export function fixMessage(issues: Issue[], tab: PathPart | null): string {
  const list = orderedIssues(issues).filter((issue) =>
    tab === null ? true : tabOfIssue(issue) === tab,
  );
  if (list.length === 0) return "";
  const shown = list.slice(0, 4).map((issue) => `${issue.where}: ${issue.reason}`);
  const more = list.length > 4 ? ` and ${list.length - 4} more` : "";
  return `Fix these in your files, then choose them together: ${shown.join("; ")}${more}.`;
}

/** "Guide 2 · Steps 4 · Scenario 1 · Quiz 4": the issues to fix per part, parts with none left out. */
export function partCounts(issues: Issue[]): string {
  const names: Record<PathPart, string> = {
    guide: "Guide",
    steps: "Steps",
    scenario: "Scenario",
    quiz: "Quiz",
  };
  return LEARNING_PATH.flatMap((part) => {
    const n = issues.filter((issue) => issue.blocking && tabOfIssue(issue) === part).length;
    return n > 0 ? [`${names[part]} ${n}`] : [];
  }).join(" · ");
}
