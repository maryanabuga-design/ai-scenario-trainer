import type { Step } from "@/lib/scenario";

export type BeatMatch = { beat: string; covered: boolean };

export type ExplanationMatch = {
  /** null when the sentence is empty: there is nothing to match. */
  percent: number | null;
  beats: BeatMatch[];
};

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
 * Simulated keyword match of the trainee's sentence against the step's key points.
 * For reference only: it never changes the score, error types, weak topics or Progress.
 */
export function matchExplanation(step: Step, sentence: string): ExplanationMatch {
  const tokens = stems(sentence);
  const beats = step.explanationKeyBeats.map((beat, index) => ({
    beat,
    covered:
      tokens.length > 0 &&
      (step.keyBeatKeywords[index] ?? []).some((keyword) => contains(tokens, keyword)),
  }));
  if (tokens.length === 0) return { percent: null, beats };
  const covered = beats.filter((beat) => beat.covered).length;
  return { percent: Math.round((covered / beats.length) * 100), beats };
}
