export const MATERIALS_TITLE = "Materials";
export const MATERIALS_SUBTITLE = "Read the training guides, then practise what you read.";

/** The reading speed the "min read" of a topic is computed from. */
export const WORDS_PER_MINUTE = 200;

/** The reading screen of a topic. */
export const readingPath = (topicId: string) => `/materials/read/${topicId}`;

/** The words of a markdown text: its marks (bullets, numbers, #, **) are not words. */
export function wordCount(markdown: string): number {
  return markdown
    .replace(/^\s*(#{1,6}\s+|[-*]\s+|\d+\.\s+)/gm, " ")
    .replaceAll("**", " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Minutes to read a text: words / 200 rounded up, and at least 1. */
export function readingMinutes(markdown: string): number {
  return Math.max(1, Math.ceil(wordCount(markdown) / WORDS_PER_MINUTE));
}

/** "5 min read". */
export function readingLabel(minutes: number): string {
  return `${minutes} min read`;
}

/** The labels of the quick-actions bar (shorter than the end block's "Steps for this topic" and "Practise this topic"). */
export const QUICK_STEPS_LABEL = "Steps";
export const QUICK_PRACTISE_LABEL = "Practise topic";
