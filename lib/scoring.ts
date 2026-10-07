import type { Confidence } from "@/lib/scenario";

export type ErrorType = "secure" | "guess" | "knowledge_gap" | "misconception";

/** From the scenario's errorTypeRule: high confidence means level 3. */
export function errorType(correct: boolean, confidence: Confidence): ErrorType {
  const high = confidence === 3;
  if (correct) return high ? "secure" : "guess";
  return high ? "misconception" : "knowledge_gap";
}
