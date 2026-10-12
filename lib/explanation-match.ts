import { getStep } from "@/lib/scenario";
import type { Step } from "@/lib/scenario";

/** Lowercase words without punctuation, with simple endings removed ("rises", "rising" → "ris"). */
function stems(text: string) {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).map((word) => {
    if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3);
    if (word.length > 4 && word.endsWith("ed") && !word.endsWith("eed")) return word.slice(0, -2);
    if (word.length > 4 && word.endsWith("es")) return word.slice(0, -2);
    if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
    if (word.length > 4 && word.endsWith("e")) return word.slice(0, -1);
    return word;
  });
}

/**
 * A keyword covers a key point when the sentence contains it: a phrase word by word in order,
 * or a single word with the same stem, or starting with it ("injur" matches "injured").
 */
function contains(sentence: string[], keyword: string) {
  const key = stems(keyword);
  if (key.length === 0) return false;
  if (key.length > 1) return ` ${sentence.join(" ")} `.includes(` ${key.join(" ")} `);
  const [word] = key;
  return sentence.some((token) => token === word || (word.length >= 5 && token.startsWith(word)));
}

/**
 * Pre-checks the self-check boxes: one per key point, checked when the sentence contains one of
 * that point's keywords. An empty sentence checks nothing. The user has the final say.
 */
export function prefillSelfCheck(step: Step, sentence: string): boolean[] {
  const tokens = stems(sentence);
  return step.explanationKeyBeats.map(
    (_, index) =>
      tokens.length > 0 &&
      (step.keyBeatKeywords[index] ?? []).some((keyword) => contains(tokens, keyword)),
  );
}

/** How many key points the user says their explanation covers, or that they skipped it. */
export type SelfCheck = { covered: number; total: number } | "skipped";

type Explained = { stepId: string; explanation: string; selfCheck?: boolean[]; skipped?: boolean };

/**
 * The self-check of one step. Answers saved before the self-check existed have no boxes, so
 * their sentence is pre-checked instead. Never part of the score or the error type.
 */
export function selfCheckOf(answer: Explained): SelfCheck {
  if (answer.skipped) return "skipped";
  const step = getStep(answer.stepId);
  const boxes = answer.selfCheck ?? prefillSelfCheck(step, answer.explanation);
  return { covered: boxes.filter(Boolean).length, total: step.explanationKeyBeats.length };
}

/** The self-check over a session's explained steps: null without steps, "skipped" if all were. */
export function sessionSelfCheck(answers: Explained[]): SelfCheck | null {
  if (answers.length === 0) return null;
  const checks = answers.map(selfCheckOf).filter((check) => check !== "skipped");
  if (checks.length === 0) return "skipped";
  return {
    covered: checks.reduce((sum, check) => sum + check.covered, 0),
    total: checks.reduce((sum, check) => sum + check.total, 0),
  };
}

export function formatSelfCheck(check: SelfCheck): string {
  return check === "skipped" ? "Skipped" : `${check.covered} of ${check.total} points`;
}
