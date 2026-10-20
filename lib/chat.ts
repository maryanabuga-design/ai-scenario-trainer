/**
 * The keyword rule of the simulated Ask AI (DESIGN.md: Ask AI): how a free question is matched against
 * the keywords of a prepared answer. Pure; the answers themselves live in `lib/ask-ai.ts`.
 */

export function tokens(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [];
}

/** A keyword matches a whole phrase, the same word, or a longer form of it ("lift" matches "lifting"). */
export function keywordMatches(keyword: string, words: string[], normalised: string) {
  const key = keyword.toLowerCase();
  if (key.includes(" ")) return normalised.includes(key);
  return words.some((word) => word === key || (key.length >= 4 && word.startsWith(key)));
}
