import data from "@/content/checklists.json";
import type { TopicIcon } from "@/lib/weak-topics";

export type Step = {
  /** Stable, never renumbered: `<checklist id>-s1`. */
  id: string;
  title: string;
  /** Short sentences or bullets, taken from the guide topic's own text. */
  details: string[];
};

/** A topic's step guide. */
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

export const STEPS_TITLE = "Steps";
export const STEPS_SUBTITLE = "Short step-by-step guides for each topic.";

/** "6 steps", or "1 step". */
export function stepCountLabel(count: number): string {
  return `${count} ${count === 1 ? "step" : "steps"}`;
}
