import type { ErrorType, ScoredItem } from "@/lib/scoring";

/** Weak error types, most serious first. Secure answers are never weak. */
export const weakPriority: ErrorType[] = [
  "misconception",
  "knowledge_gap",
  "guess",
];

/** Names of the Lucide icons a topic can show. The component maps each name to its icon. */
export type TopicIcon =
  | "BellRing"
  | "DoorOpen"
  | "Wind"
  | "MapPin"
  | "Phone"
  | "HeartPulse"
  | "Bandage"
  | "ClipboardList"
  | "Droplet"
  | "BookOpen";

const sectionIcons: Record<string, TopicIcon> = {
  S1: "BellRing",
  S2: "DoorOpen",
  S3: "Wind",
  S4: "MapPin",
  S5: "Phone",
  S6: "HeartPulse",
  S7: "Bandage",
  S8: "Bandage",
  S9: "HeartPulse",
  S10: "ClipboardList",
};

/** The icon for a guide section: every flood section is a water drop; unknown ones a book. */
export function topicIcon(sectionId: string): TopicIcon {
  if (sectionId.startsWith("F")) return "Droplet";
  return sectionIcons[sectionId] ?? "BookOpen";
}

/** The tile colour comes from the material, never from the error type. */
export function topicTone(sectionId: string): "yellow" | "blue" {
  return sectionId.startsWith("F") ? "blue" : "yellow";
}

export type WeakTopic = {
  /** The guide section, for example S2 or F5. */
  sectionId: string;
  /** The topic's icon name, from its guide section. */
  icon: TopicIcon;
  /** The most serious error type among the topic's weak answers. */
  errorType: ErrorType;
  /** The weak steps and questions behind this topic. */
  items: ScoredItem[];
};

export type RepeatItem = { type: "step" | "question"; id: string };

const sectionOrder = (id: string) =>
  [id[0] === "S" ? 0 : 1, Number(id.slice(1))] as const;

/**
 * Groups weak answers into topics (one per guide section). Ordered by error type priority,
 * then by how many answers are weak, then by guide order.
 */
export function weakTopics(weakItems: ScoredItem[]): WeakTopic[] {
  const bySection = new Map<string, ScoredItem[]>();
  weakItems
    .filter((item) => item.errorType !== "secure")
    .forEach((item) =>
      item.sources.forEach((sectionId) =>
        bySection.set(sectionId, [...(bySection.get(sectionId) ?? []), item]),
      ),
    );
  return [...bySection.entries()]
    .map(([sectionId, items]) => ({
      sectionId,
      icon: topicIcon(sectionId),
      items,
      errorType:
        weakPriority.find((type) =>
          items.some((item) => item.errorType === type),
        ) ?? "guess",
    }))
    .sort((a, b) => {
      const byType =
        weakPriority.indexOf(a.errorType) - weakPriority.indexOf(b.errorType);
      if (byType !== 0) return byType;
      if (a.items.length !== b.items.length)
        return b.items.length - a.items.length;
      const [ag, an] = sectionOrder(a.sectionId);
      const [bg, bn] = sectionOrder(b.sectionId);
      return ag - bg || an - bn;
    });
}

export function countTopics(topics: WeakTopic[]): Record<ErrorType, number> {
  const counts: Record<ErrorType, number> = {
    secure: 0,
    guess: 0,
    knowledge_gap: 0,
    misconception: 0,
  };
  topics.forEach((topic) => counts[topic.errorType]++);
  return counts;
}

const countWords: Record<ErrorType, [string, string]> = {
  misconception: ["misconception", "misconceptions"],
  knowledge_gap: ["knowledge gap", "knowledge gaps"],
  guess: ["guess", "guesses"],
  secure: ["secure answer", "secure answers"],
};

/** "1 misconception, 2 knowledge gaps", in priority order, leaving out zero counts. */
export function describeCounts(counts: Record<ErrorType, number>): string {
  return weakPriority
    .filter((type) => counts[type] > 0)
    .map(
      (type) =>
        `${counts[type]} ${countWords[type][counts[type] === 1 ? 0 : 1]}`,
    )
    .join(", ");
}

/** The steps and questions to repeat for some topics, each once, in topic order. */
export function repeatItems(topics: WeakTopic[]): RepeatItem[] {
  const seen = new Set<string>();
  return topics.flatMap((topic) =>
    topic.items.flatMap((item) => {
      if (seen.has(item.id)) return [];
      seen.add(item.id);
      return [{ type: item.kind, id: item.id }];
    }),
  );
}

/** Short name of the material a section belongs to, for the topic's source line. */
export function materialForSection(sectionId: string): string {
  return sectionId.startsWith("F") ? "Flood guide" : "Evacuation guide";
}
