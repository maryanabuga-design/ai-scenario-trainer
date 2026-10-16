import { questions } from "@/lib/quiz";
import { scenarios } from "@/lib/scenario";

/** A short, stable hash of a text (djb2), written in base 36. */
function hash(text: string): string {
  let value = 5381;
  for (let index = 0; index < text.length; index++) {
    value = ((value << 5) + value + text.charCodeAt(index)) >>> 0;
  }
  return value.toString(36);
}

/**
 * The content fingerprint: a hash of the ids of every scenario step and quiz question. It is saved
 * with the progress, so data written for other content is cleaned when it is read.
 */
export const contentFingerprint = hash(
  [...scenarios.flatMap((scenario) => scenario.steps), ...questions]
    .map((item) => item.id)
    .sort()
    .join(","),
);
