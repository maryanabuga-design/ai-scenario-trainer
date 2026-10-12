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

export type TopicPill = { text: string; progress: number | null };

/** "2 to repeat", or "1 of 2 repeated" with a progress share once its repeat round has started. */
export function topicPill(topic: WeakTopic, unfinished: Session | null): TopicPill {
  if (unfinished && isRepeatRound(unfinished) && repeatUnderWay(topic, unfinished)) {
    const done = unfinished.answers.length;
    const total = unfinished.items.length;
    return { text: `${done} of ${total} repeated`, progress: total === 0 ? 0 : done / total };
  }
  return { text: `${topic.items.length} to repeat`, progress: null };
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

/** "Short: 3 decisions, about 5 min. Full: 6 decisions, about 10 min." and the quiz line. */
export function scenarioLines(def: ScenarioDef): string[] {
  const lengths = (["short", "full"] as const).flatMap((length) => {
    const option = def.lengths[length];
    if (!option) return [];
    const name = length === "short" ? "Short" : "Full";
    return [`${name}: ${option.stepIds.length} decisions, about ${option.minutes} min.`];
  });
  return [lengths.join(" "), "Or take a quiz on any guide sections, with five kinds of questions."];
}

export function scenarioTitle(material: Material): string {
  return getScenario(material.scenarioId).title;
}
