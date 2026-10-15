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
