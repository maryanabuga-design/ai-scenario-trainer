import { sessionLabel } from "@/lib/progress";
import type { Material } from "@/lib/materials";
import { getScenario, sessionLengths } from "@/lib/scenario";
import type { ScenarioDef } from "@/lib/scenario";
import { planTraining } from "@/lib/training";
import type { Session } from "@/lib/session";
import { isQuiz, isRepeatRound, itemCount } from "@/lib/session";
import type { WeakTopic } from "@/lib/weak-topics";
import { countTopics, describeCounts } from "@/lib/weak-topics";

/** The topic row on Home shows at most this many cards (and as many dots). */
export const TOPIC_ROW_LIMIT = 5;

export type NextUp = {
  kind: "continue" | "repeat" | "first" | "new";
  title: string;
  detail: string;
  action: "Continue" | "Repeat weak topics" | "Start a scenario";
  /** Only the repeat state links its top row (tile, text, arrow) to the Weak topics page. */
  linksToTopics: boolean;
};

/** The "Next up" card: the first state that applies. */
export function nextUp({
  unfinished,
  topics,
  hasHistory,
}: {
  unfinished: Session | null;
  topics: WeakTopic[];
  hasHistory: boolean;
}): NextUp {
  if (unfinished) {
    const unit = isRepeatRound(unfinished) ? "Item" : isQuiz(unfinished) ? "Question" : "Step";
    return {
      kind: "continue",
      title: `Continue your ${sessionLabel(unfinished).toLowerCase()}`,
      detail: `${unit} ${unfinished.index + 1} of ${itemCount(unfinished)}`,
      action: "Continue",
      linksToTopics: false,
    };
  }
  if (topics.length > 0) {
    return {
      kind: "repeat",
      title: `${topics.length} ${topics.length === 1 ? "topic" : "topics"} to repeat`,
      detail: describeCounts(countTopics(topics)),
      action: "Repeat weak topics",
      linksToTopics: true,
    };
  }
  if (!hasHistory) {
    return {
      kind: "first",
      title: "Start your first scenario",
      detail: `A short scenario takes about ${sessionLengths.short.minutes} minutes.`,
      action: "Start a scenario",
      linksToTopics: false,
    };
  }
  return {
    kind: "new",
    title: "Ready for a new scenario",
    detail: "Nothing to repeat right now.",
    action: "Start a scenario",
    linksToTopics: false,
  };
}

/** The topic cards on Home, by priority, at most five. */
export function topicRow(topics: WeakTopic[]): WeakTopic[] {
  return topics.slice(0, TOPIC_ROW_LIMIT);
}

/** One pagination dot per card in the row. */
export function dotCount(topics: WeakTopic[]): number {
  return topicRow(topics).length;
}

/** True when the unfinished session is a repeat round for this topic alone. */
export function repeatUnderWay(topic: WeakTopic, unfinished: Session | null): boolean {
  return (
    unfinished !== null &&
    isRepeatRound(unfinished) &&
    unfinished.topics.length === 1 &&
    unfinished.topics[0] === topic.sectionId
  );
}

/** The card in view: by scroll position, and the last card once the row is scrolled to its end. */
export function currentCard({
  scrollLeft,
  maxScroll,
  step,
  count,
}: {
  scrollLeft: number;
  maxScroll: number;
  step: number;
  count: number;
}): number {
  if (count === 0) return 0;
  if (scrollLeft >= maxScroll - 2) return count - 1;
  return Math.min(count - 1, Math.max(0, Math.round(scrollLeft / step)));
}

/**
 * The materials shown under "New scenario": ready ones whose content holds a whole prepared
 * scenario, one card per scenario (a re-uploaded copy of the guide does not add a second card).
 */
export function homeScenarios(materials: Material[]): Material[] {
  const seen = new Set<string>();
  return materials.filter((material) => {
    if (material.status !== "ready") return false;
    const plan = planTraining(material);
    if (!plan.canScenario || seen.has(plan.scenarioId)) return false;
    seen.add(plan.scenarioId);
    return true;
  });
}

/** The New scenario card line, from the Short length: "Short: 3 decisions, about 5 min." */
export function scenarioLine(def: ScenarioDef): string {
  const length = def.lengths.short ? "short" : def.defaultLength;
  const option = def.lengths[length];
  const name = length === "short" ? "Short" : length === "full" ? "Full" : "Extended";
  return `${name}: ${option?.stepIds.length ?? 0} decisions, about ${option?.minutes ?? 0} min.`;
}

export function scenarioTitle(material: Material): string {
  return getScenario(material.scenarioId).title;
}
