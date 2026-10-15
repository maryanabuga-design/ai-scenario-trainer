import { getStep } from "@/lib/scenario";
import { getQuestion } from "@/lib/quiz";

/** A picture for a question: files live in public/scenarios/. An empty `src` shows the placeholder. */
export type ContentImage = { src: string; alt: string };

export type Option = { id: string; text: string };

export type SuggestedQuestion = {
  question: string;
  closestSources: string[];
  keywords: string[];
};

export type ChatEntry = {
  id: string;
  question: string;
  answer: string;
  sources: string[];
  keywords: string[];
  /** "afterFeedback" answers explain the options, so they stay hidden until the person has answered. */
  availability: "always" | "afterFeedback";
  suggested: boolean;
};

/**
 * The one shape of a scenario step and a quiz question: a question with 3 or 4 options (two for
 * true or false) and one correct answer. `situation` and `title` exist on scenario steps only.
 */
export type Item = {
  id: string;
  kind: "step" | "question";
  /** The guide section the item counts for. */
  section: string;
  title?: string;
  situation?: string;
  question: string;
  options: Option[];
  correctOptionId: string;
  why: string;
  /** The guide sections shown as Guide chips. */
  guideRef: string[];
  image?: ContentImage;
  /** A reminder of what to think about; never the answer. Without one, a fallback is built from guideRef. */
  hint?: string;
  /** "true-false" has two options, True and False; the default is "single". */
  type?: "single" | "true-false";
  /** Prepared Ask AI answers (scenario steps of the evacuation guide only). */
  chat?: ChatEntry[];
  suggestedQuestion?: SuggestedQuestion;
};

/** The step or question with this id, or undefined (for example in an old saved session). */
export function findItem(id: string): Item | undefined {
  try {
    return getItem(id);
  } catch {
    return undefined;
  }
}

/** A scenario step or a quiz question, by id. */
export function getItem(id: string): Item {
  try {
    return getStep(id);
  } catch {
    return getQuestion(id);
  }
}

/** The position of a guide section in guide order: S1 to S10, then F1 to F7. */
export function sectionOrder(sectionId: string): number {
  return (sectionId.startsWith("S") ? 0 : 100) + Number(sectionId.slice(1));
}

export function inGuideOrder(sections: string[]): string[] {
  return [...sections].sort((a, b) => sectionOrder(a) - sectionOrder(b));
}

/** The text of a hint and the guide section it points to; null when the question has neither. */
export type Hint = { text: string; section: string | null };

/**
 * The hint of a question: its own `hint`, or "Review: <section title>" built from `guideRef`, or
 * nothing. `titleOf` finds a section's title.
 */
export function hintFor(
  item: Item,
  titleOf: (sectionId: string) => string | undefined,
): Hint | null {
  const section = item.guideRef[0] ?? null;
  if (item.hint) return { text: item.hint, section };
  if (!section) return null;
  return { text: `Review: ${titleOf(section) ?? section}`, section };
}
