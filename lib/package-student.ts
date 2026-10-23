import type { Checklist } from "@/lib/checklists";
import type { Item } from "@/lib/items";
import { LETTERS, findImage } from "@/lib/package-read";
import type { PackageData } from "@/lib/package-read";
import { readingMinutes } from "@/lib/reading";

/**
 * What the student screens of a demo topic are made of (DESIGN.md: Content package review, preview
 * parity): the guide's reading time, the step guide in the shape of a built-in one, and the scenario
 * and quiz as the same `Item` the shared question screen draws. Pure: nothing is read from or saved to
 * any store, so the Student and Preview as student draw exactly the same.
 */

/** The reading time of the guide in minutes (at least 1), as for a built-in topic. */
export const demoMinutes = (data: PackageData) =>
  readingMinutes(
    (data.guide ?? []).map((section) => `${section.title}\n${section.text}`).join("\n"),
  );

/** The step guide(s) of the package as ONE step guide of the built-in shape, or null without steps. */
export function demoStepGuide(data: PackageData, title: string): Checklist | null {
  const lists = data.steps ?? [];
  const steps = lists.flatMap((list, li) =>
    list.steps.map((step, si) => ({
      id: `pkg-${li}-${si}`,
      title: step.action,
      details: step.detail ? [step.detail] : [],
    })),
  );
  if (steps.length === 0) return null;
  return {
    id: "demo",
    title: lists.length === 1 ? lists[0].title : title,
    topic: "demo",
    icon: "ClipboardList",
    guideRef: [],
    steps,
  };
}

/** The guide section numbers of the steps, in the order of `demoStepGuide`'s steps (for the guide link under each). */
export const stepExtras = (data: PackageData) =>
  (data.steps ?? []).flatMap((list) =>
    list.steps.map((step) => ({
      guideRef: step.guideRef.trim(),
      imageFile: step.imageFile,
      alt: step.alt,
    })),
  );

export type PracticePart = "scenario" | "quiz" | "practise";

const optionsOf = (options: string[]) =>
  options.flatMap((text, i) => (text === "" ? [] : [{ id: LETTERS[i], text }]));

/** The scenario steps and/or the quiz questions of a package as items of the shared question screen. */
export function demoItems(data: PackageData, part: PracticePart): Item[] {
  const steps: Item[] =
    part === "quiz"
      ? []
      : (data.scenario ?? []).flatMap((step, i) =>
          step.correct
            ? [
                {
                  id: `pkg-scenario-${i}`,
                  kind: "question" as const,
                  section: "",
                  situation: step.situation || undefined,
                  question: step.question,
                  options: optionsOf(step.options),
                  correctOptionId: step.correct,
                  why: step.why,
                  guideRef: [],
                  ...imageOf(data, step.imageFile, step.alt),
                },
              ]
            : [],
        );
  const questions: Item[] =
    part === "scenario"
      ? []
      : (data.questions ?? []).flatMap((q, i) =>
          q.correct
            ? [
                {
                  id: `pkg-quiz-${i}`,
                  kind: "question" as const,
                  section: "",
                  question: q.text,
                  options: optionsOf(q.options),
                  correctOptionId: q.correct,
                  why: q.explanation,
                  guideRef: [],
                  ...imageOf(data, q.imageFile, q.alt),
                },
              ]
            : [],
        );
  return [...steps, ...questions];
}

function imageOf(data: PackageData, file: string, alt: string) {
  const image = findImage(data, file);
  return image ? { image: { src: image.data, alt } } : {};
}
