import type { ChatEntry, Step } from "@/lib/scenario";

/** "decide" before the trainee has checked their answer, "feedback" after. */
export type ChatPhase = "decide" | "feedback";

export type ChatReply =
  | { kind: "answer"; text: string; sources: string[] }
  | { kind: "notCovered"; sources: string[] }
  | { kind: "deferred"; sources: string[] };

export type ChatChip = { id: string; question: string };

export const notCoveredText = "This is not covered by the material.";
export const deferredText =
  "I can explain this after you check your answer, so the choice stays yours.";

const MAX_CHIPS = 4;

/** Every prepared answer for the step, with the step's not-covered question as one more entry. */
function entries(step: Step): (ChatEntry & { notCovered?: boolean })[] {
  const question = step.suggestedQuestion;
  if (!question) return step.chat;
  return [
    ...step.chat,
    {
      id: notCoveredId(step),
      question: question.question,
      answer: notCoveredText,
      sources: question.closestSources,
      keywords: question.keywords,
      availability: "always",
      suggested: true,
      notCovered: true,
    },
  ];
}

export function notCoveredId(step: Step) {
  return `${step.id}-not-covered`;
}

function isAvailable(entry: ChatEntry, phase: ChatPhase) {
  return entry.availability === "always" || phase === "feedback";
}

/** 3 or 4 suggested questions: before feedback only neutral ones, after feedback the "why not" ones first. */
export function suggestedChips(step: Step, phase: ChatPhase, askedIds: string[]): ChatChip[] {
  const suggested = entries(step).filter(
    (entry) => entry.suggested && isAvailable(entry, phase) && !askedIds.includes(entry.id),
  );
  // After the answer, the "why not" questions come first, then the guide's not-covered question,
  // so the honest "This is not covered by the material." stays one tap away.
  const ordered =
    phase === "feedback"
      ? [
          ...suggested.filter((entry) => entry.availability === "afterFeedback").slice(0, 2),
          ...suggested.filter((entry) => entry.notCovered),
          ...suggested.filter((entry) => entry.availability === "afterFeedback").slice(2),
          ...suggested.filter((entry) => entry.availability === "always" && !entry.notCovered),
        ]
      : suggested;
  return ordered.slice(0, MAX_CHIPS).map(({ id, question }) => ({ id, question }));
}

function replyFor(
  step: Step,
  entry: ChatEntry & { notCovered?: boolean },
  phase: ChatPhase,
): ChatReply {
  if (!isAvailable(entry, phase)) return { kind: "deferred", sources: step.sources };
  if (entry.notCovered) return { kind: "notCovered", sources: entry.sources };
  return { kind: "answer", text: entry.answer, sources: entry.sources };
}

/** The reply to a tapped suggestion chip. */
export function replyToChip(step: Step, chipId: string, phase: ChatPhase): ChatReply {
  const entry = entries(step).find((candidate) => candidate.id === chipId);
  if (!entry) return { kind: "notCovered", sources: step.sources };
  return replyFor(step, entry, phase);
}

function tokens(text: string) {
  return text.toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [];
}

/** A keyword matches a whole phrase, the same word, or a longer form of it ("lift" matches "lifting"). */
function keywordMatches(keyword: string, words: string[], normalised: string) {
  const key = keyword.toLowerCase();
  if (key.includes(" ")) return normalised.includes(key);
  return words.some((word) => word === key || (key.length >= 4 && word.startsWith(key)));
}

/**
 * The reply to a free question. The prepared entry with the most matching keywords wins;
 * on a tie the earlier entry wins. No match at all gets the honest not-covered answer
 * with the step's guide sections as the closest ones.
 */
export function matchQuestion(step: Step, text: string, phase: ChatPhase): ChatReply {
  const words = tokens(text);
  const normalised = words.join(" ");
  let best: { entry: ReturnType<typeof entries>[number]; score: number } | null = null;

  for (const entry of entries(step)) {
    const score = entry.keywords.filter((keyword) =>
      keywordMatches(keyword, words, normalised),
    ).length;
    if (score > 0 && (!best || score > best.score)) best = { entry, score };
  }

  if (!best) return { kind: "notCovered", sources: step.sources };
  return replyFor(step, best.entry, phase);
}
