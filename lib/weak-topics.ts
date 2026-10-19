import { sectionOrder } from "@/lib/items";
import type { ScoredItem } from "@/lib/scoring";

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
  | "Flame"
  | "BookOpen"
  | "FileText";

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

/** The icon for a guide section: every flood section is a water drop; unknown ones a neutral document. */
export function topicIcon(sectionId: string): TopicIcon {
  if (sectionId.startsWith("F")) return "Droplet";
  return sectionIcons[sectionId] ?? "FileText";
}

export type WeakTopic = {
  /** The guide section, for example S2 or F5. */
  sectionId: string;
  /** The topic's icon name, from its guide section. */
  icon: TopicIcon;
  /** The wrong answers behind this topic. */
  items: ScoredItem[];
};

/**
 * Groups wrong answers into topics, one per guide section. Ordered by how many answers are wrong,
 * then by guide order.
 */
export function weakTopics(weakItems: ScoredItem[]): WeakTopic[] {
  const bySection = new Map<string, ScoredItem[]>();
  weakItems
    .filter((item) => !item.correct)
    .forEach((item) => bySection.set(item.section, [...(bySection.get(item.section) ?? []), item]));
  return [...bySection.entries()]
    .map(([sectionId, items]) => ({ sectionId, icon: topicIcon(sectionId), items }))
    .sort(
      (a, b) =>
        b.items.length - a.items.length || sectionOrder(a.sectionId) - sectionOrder(b.sectionId),
    );
}

/** "3 topics to repeat" or "1 topic to repeat". */
export function topicsToRepeat(count: number): string {
  return `${count} ${count === 1 ? "topic" : "topics"} to repeat`;
}

/** "2 to repeat": the number of wrong answers in one topic. */
export function toRepeatLabel(topic: WeakTopic): string {
  return `${topic.items.length} to repeat`;
}

/** The questions to repeat for some topics, each once, in topic order. */
export function repeatItemIds(topics: WeakTopic[]): string[] {
  return [...new Set(topics.flatMap((topic) => topic.items.map((item) => item.id)))];
}

/** Short name of the material a section belongs to, for the topic's source line. */
export function materialForSection(sectionId: string): string {
  return sectionId.startsWith("F") ? "Flood guide" : "Evacuation guide";
}
