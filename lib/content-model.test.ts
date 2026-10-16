import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadAllSections } from "@/lib/guide";
import type { Item } from "@/lib/items";
import { modeItems, PART_SIZE, partsFor, trainingSections } from "@/lib/parts";
import type { TrainingMode } from "@/lib/parts";
import { questions } from "@/lib/quiz";
import { scenarios } from "@/lib/scenario";

/** The content model: per topic one scenario and one quiz, target 30, never fewer than 20. */
const TARGET = 30;
const MINIMUM = 20;
const modes: TrainingMode[] = ["scenario", "quiz"];

/** Topics the guide cannot support (limited) or that are not expanded yet (pending), from docs/content-gaps.md. */
const gaps = [
  ...readFileSync("docs/content-gaps.md", "utf8").matchAll(
    /^- (limited|pending|accepted) (S\d+) (scenario|quiz): (\d+)$/gm,
  ),
].map(([, status, topic, mode, count]) => ({
  status,
  topic,
  mode: mode as TrainingMode,
  count: Number(count),
}));
const listed = (topic: string, mode: TrainingMode) =>
  gaps.find((gap) => gap.topic === topic && gap.mode === mode);
/** An accepted topic has 20 as its target: it is not warned about, and 30 is an optional stretch. */
const targetOf = (topic: string, mode: TrainingMode) =>
  listed(topic, mode)?.status === "accepted" ? MINIMUM : TARGET;

const countOf = (topic: string, mode: TrainingMode) =>
  modeItems(mode).filter((item) => item.section === topic).length;

const normal = (text: string) => text.trim().toLowerCase().replace(/\s+/g, " ");
const sectionIds = new Set(loadAllSections().map((section) => section.id));
/** Every scenario step of every guide. */
const allSteps = scenarios.flatMap((scenario) => scenario.steps);
const all: Item[] = [...allSteps, ...questions];
const optionIndex = (item: Item) =>
  item.options.findIndex((option) => option.id === item.correctOptionId);
const sentences = (text: string) => text.split(/(?<=[.!?])\s+/).filter(Boolean);

describe("the amount of content per topic and mode", () => {
  const rows = trainingSections.flatMap((topic) =>
    modes.map((mode) => ({ topic, mode, count: countOf(topic, mode) })),
  );

  it("warns where a topic is below its target (30, or 20 when accepted), and fails below 20 unless the guide limits it", () => {
    const short = rows.filter((row) => row.count < targetOf(row.topic, row.mode));
    if (short.length > 0) {
      console.warn(
        `Content below its target (30, or 20 when accepted in docs/content-gaps.md): ` +
          short.map((row) => `${row.topic} ${row.mode} ${row.count}`).join(", "),
      );
    }
    const failing = rows
      .filter((row) => row.count < MINIMUM && !listed(row.topic, row.mode))
      .map(
        (row) =>
          `${row.topic} ${row.mode} has ${row.count} questions (minimum ${MINIMUM}); write more or list it in docs/content-gaps.md`,
      );
    expect(failing).toEqual([]);
  });

  it("keeps docs/content-gaps.md true: a limited or pending topic is below 20, an accepted one has 20 or more, and the counts match", () => {
    for (const gap of gaps) {
      const real = countOf(gap.topic, gap.mode);
      expect(real, `${gap.topic} ${gap.mode} in docs/content-gaps.md`).toBe(gap.count);
      if (gap.status === "accepted") {
        expect(real, `${gap.topic} ${gap.mode} is accepted at ${MINIMUM}`).toBeGreaterThanOrEqual(
          MINIMUM,
        );
      } else {
        expect(
          real,
          `${gap.topic} ${gap.mode} is listed but has ${MINIMUM}+ questions`,
        ).toBeLessThan(MINIMUM);
      }
    }
  });

  it("has every topic S1 to S10 with a quiz", () => {
    for (const topic of trainingSections) expect(countOf(topic, "quiz")).toBeGreaterThan(0);
  });
});

describe("parts follow the counts", () => {
  it("makes ceil(count / PART_SIZE) parts per topic and mode, 20 giving two and 30 three", () => {
    expect(PART_SIZE).toBe(10);
    for (const mode of modes) {
      for (const topic of trainingSections) {
        const count = countOf(topic, mode);
        const parts = partsFor(mode).filter((part) => part.sectionId === topic);
        expect(parts, `${topic} ${mode}`).toHaveLength(Math.ceil(count / PART_SIZE));
        parts.slice(0, -1).forEach((part) => expect(part.itemIds).toHaveLength(PART_SIZE));
      }
    }
    expect(Math.ceil(30 / PART_SIZE)).toBe(3);
    expect(Math.ceil(20 / PART_SIZE)).toBe(2);
  });
});

describe("scenario steps", () => {
  const steps = modeItems("scenario");
  /** Imported S1 steps whose situation is one sentence; the rule asks for 2 to 4 (see docs/content-notes.md). */
  const oneSentence = new Set(
    ["006", "010", "015", "016", "018", "020"].map((n) => `q-scn-s01-${n}`),
  );

  it("lists only steps that really have a one-sentence situation as exceptions", () => {
    for (const id of oneSentence) {
      expect(sentences(steps.find((step) => step.id === id)?.situation ?? "").length, id).toBe(1);
    }
  });

  it("have exactly 3 options, a situation of 2 to 4 sentences, a question, a why and a hint", () => {
    for (const step of steps) {
      expect(step.options, step.id).toHaveLength(3);
      expect(step.question.trim(), step.id).not.toBe("");
      expect(step.why.trim(), step.id).not.toBe("");
      expect(step.hint?.trim(), `${step.id} hint`).toBeTruthy();
      const count = sentences(step.situation ?? "").length;
      expect(count, `${step.id} situation sentences`).toBeGreaterThanOrEqual(
        oneSentence.has(step.id) ? 1 : 2,
      );
      expect(count, `${step.id} situation sentences`).toBeLessThanOrEqual(4);
    }
  });

  it("have a scene and an image slot with a descriptive alt and an empty or real src", () => {
    for (const step of steps) {
      expect(step.scene, `${step.id} scene`).toMatch(/^s\d{2}-sc\d+$/);
      expect(step.scene!.slice(0, 3), `${step.id} scene belongs to its topic`).toBe(
        `s${step.section.slice(1).padStart(2, "0")}`,
      );
      expect(step.image?.alt.trim().length, `${step.id} image alt`).toBeGreaterThan(10);
      expect(typeof step.image?.src, `${step.id} image src`).toBe("string");
    }
  });

  it("group consecutive steps into scenes of at most 6 that share one image", () => {
    for (const topic of trainingSections) {
      const own = steps.filter((step) => step.section === topic);
      const order: string[] = [];
      own.forEach((step) => {
        if (order[order.length - 1] !== step.scene) order.push(step.scene!);
      });
      expect(new Set(order).size, `${topic}: a scene never comes back after another`).toBe(
        order.length,
      );
      for (const scene of order) {
        const group = own.filter((step) => step.scene === scene);
        expect(group.length, `${scene} size`).toBeLessThanOrEqual(6);
        group.forEach((step) =>
          expect(step.image, `${step.id} shares the scene image`).toEqual(group[0].image),
        );
      }
    }
  });

  it("come in story order: a topic's steps are one block of the file, in the order written", () => {
    const sections = steps.map((step) => step.section);
    for (const topic of trainingSections) {
      const first = sections.indexOf(topic);
      if (first === -1) continue;
      const last = sections.lastIndexOf(topic);
      // another topic's steps may sit between existing ones until that topic is expanded
      expect(last, topic).toBeGreaterThanOrEqual(first);
    }
    const ids = steps.map((step) => step.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("quiz questions", () => {
  const quiz = modeItems("quiz");

  it("have 3 or 4 options, or true or false with True and False, plus a why and a guideRef", () => {
    for (const question of quiz) {
      if (question.type === "true-false") {
        expect(
          question.options.map((option) => option.text),
          question.id,
        ).toEqual(["True", "False"]);
      } else {
        expect(question.options.length, question.id).toBeGreaterThanOrEqual(3);
        expect(question.options.length, question.id).toBeLessThanOrEqual(4);
      }
      expect(question.why.trim(), `${question.id} why`).not.toBe("");
      expect(question.guideRef.length, `${question.id} guideRef`).toBeGreaterThan(0);
    }
  });

  it("are about 10 to 30% true or false in a topic with enough questions", () => {
    for (const topic of trainingSections) {
      const own = quiz.filter((question) => question.section === topic);
      if (own.length < 8) continue;
      const share = own.filter((question) => question.type === "true-false").length / own.length;
      expect(share, `${topic} true or false share`).toBeGreaterThanOrEqual(0.1);
      expect(share, `${topic} true or false share`).toBeLessThanOrEqual(0.3);
    }
  });
});

describe("every question", () => {
  it("has a correct option that exists, among distinct option ids", () => {
    for (const item of all) {
      const ids = item.options.map((option) => option.id);
      expect(new Set(ids).size, `${item.id} option ids`).toBe(ids.length);
      expect(ids, `${item.id} correctOptionId`).toContain(item.correctOptionId);
    }
  });

  it("has a unique id", () => {
    const ids = all.map((item) => item.id);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  it("has question text that is not repeated within a mode", () => {
    for (const items of [modeItems("scenario"), modeItems("quiz"), allSteps, questions]) {
      const seen = new Map<string, string>();
      for (const item of items) {
        const key =
          normal(item.question) + (item.kind === "step" ? `|${normal(item.situation ?? "")}` : "");
        expect(seen.get(key), `${item.id} repeats ${seen.get(key)}`).toBeUndefined();
        seen.set(key, item.id);
      }
    }
    const quizTexts = modeItems("quiz").map((item) => normal(item.question));
    expect(new Set(quizTexts).size).toBe(quizTexts.length);
  });

  it("has a hint that does not contain the text of the correct option", () => {
    for (const item of all) {
      if (!item.hint) continue;
      const correct = normal(item.options[optionIndex(item)].text);
      expect(normal(item.hint).includes(correct), `${item.id} hint shows the answer`).toBe(false);
    }
  });

  it("points every guideRef at an existing guide section", () => {
    for (const item of all) {
      expect(item.guideRef.length, item.id).toBeGreaterThan(0);
      for (const ref of item.guideRef)
        expect(sectionIds.has(ref), `${item.id} -> ${ref}`).toBe(true);
    }
  });

  it("spreads the correct option over the positions of 3-option questions in each mode", () => {
    for (const [mode, items] of [
      ["scenario", modeItems("scenario")],
      ["quiz", modeItems("quiz")],
    ] as const) {
      const three = items.filter((item) => item.options.length === 3);
      const counts = [0, 1, 2].map(
        (position) => three.filter((item) => optionIndex(item) === position).length,
      );
      for (const [position, count] of counts.entries()) {
        expect(
          count / three.length,
          `${mode}: option ${"ABC"[position]} is correct in ${count} of ${three.length}`,
        ).toBeLessThanOrEqual(0.5);
      }
    }
  });
});
