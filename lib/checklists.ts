import data from "@/content/checklists.json";
import type { TopicIcon } from "@/lib/weak-topics";

export type Step = {
  /** Stable, never renumbered: `<checklist id>-s1`. */
  id: string;
  title: string;
  /** Short sentences or bullets, taken from the guide topic's own text. */
  details: string[];
};

/** A step guide (the file and routes still say "checklist"). */
export type Checklist = {
  id: string;
  title: string;
  /** The guide topic this step guide belongs to: its reading screen and its practice. */
  topic: string;
  /** The icon of this guide on the Steps list and the summary card. */
  icon: TopicIcon;
  /** The guide sections the steps come from. */
  guideRef: string[];
  steps: Step[];
  /** A link to the source, only when the content has one; never invented. */
  source?: { label: string; url: string };
};

/** The step guides, written from the guide's own sentences. */
export const checklists = data.checklists as Checklist[];

export function getChecklist(id: string): Checklist | undefined {
  return checklists.find((checklist) => checklist.id === id);
}

export const STEPS_TITLE = "Step guides";
export const STEPS_SUBTITLE = "Short step-by-step guides for the topics that have one.";

/** The Materials view of the step guides (`/materials?view=steps`). */
export const STEP_GUIDES_PATH = "/materials?view=steps";

/** "6 steps · S1": the second line of a step guide row. */
export const stepGuideLine = (checklist: Checklist) =>
  `${stepCountLabel(checklist.steps.length)} · ${checklist.topic}`;

/** "6 steps", or "1 step". */
export function stepCountLabel(count: number): string {
  return `${count} ${count === 1 ? "step" : "steps"}`;
}
