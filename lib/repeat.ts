import type { WeakTopic } from "@/lib/weak-topics";
import { repeatItemIds } from "@/lib/weak-topics";
import { startSession } from "@/lib/session";

/** Starts a repeat round with the questions answered wrong in the chosen topics. */
export function startRepeat(topics: WeakTopic[]) {
  startSession("repeat", repeatItemIds(topics));
}
