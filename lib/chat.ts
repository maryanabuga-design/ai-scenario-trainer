import type { ChatEntry, Item as Step } from "@/lib/items";

export type ChatReply =
  { kind: "answer"; text: string; sources: string[] } | { kind: "notCovered"; sources: string[] };

export type ChatChip = { id: string; question: string };

export const notCoveredText = "This is not covered by the material.";

const MAX_CHIPS = 4;

/** Every prepared answer for the step, with the step's not-covered question as one more entry. */
function entries(step: Step): (ChatEntry & { notCovered?: boolean })[] {
  const question = step.suggestedQuestion;
  if (!question) return step.chat ?? [];
  return [
    ...(step.chat ?? []),
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

/**
 * 3 or 4 suggested questions: the "why not" questions come first, then the guide's not-covered
 * question, so the honest "This is not covered by the material." stays one tap away.
 */
export function suggestedChips(step: Step, askedIds: string[]): ChatChip[] {
  const suggested = entries(step).filter(
    (entry) => entry.suggested && !askedIds.includes(entry.id),
  );
  const ordered = [
    ...suggested.filter((entry) => entry.availability === "afterFeedback").slice(0, 2),
    ...suggested.filter((entry) => entry.notCovered),
    ...suggested.filter((entry) => entry.availability === "afterFeedback").slice(2),
    ...suggested.filter((entry) => entry.availability === "always" && !entry.notCovered),
  ];
  return ordered.slice(0, MAX_CHIPS).map(({ id, question }) => ({ id, question }));
}

function replyFor(step: Step, entry: ChatEntry & { notCovered?: boolean }): ChatReply {
  if (entry.notCovered) return { kind: "notCovered", sources: entry.sources };
  return { kind: "answer", text: entry.answer, sources: entry.sources };
}

/** The reply to a tapped suggestion chip. */
export function replyToChip(step: Step, chipId: string): ChatReply {
  const entry = entries(step).find((candidate) => candidate.id === chipId);
  if (!entry) return { kind: "notCovered", sources: step.guideRef };
  return replyFor(step, entry);
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
export function matchQuestion(step: Step, text: string): ChatReply {
  const words = tokens(text);
  const normalised = words.join(" ");
  let best: { entry: ReturnType<typeof entries>[number]; score: number } | null = null;

  for (const entry of entries(step)) {
    const score = entry.keywords.filter((keyword) =>
      keywordMatches(keyword, words, normalised),
    ).length;
    if (score > 0 && (!best || score > best.score)) best = { entry, score };
  }

  if (!best) return { kind: "notCovered", sources: step.guideRef };
  return replyFor(step, best.entry);
}
