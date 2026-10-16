import { checklists } from "@/lib/checklists";
import { loadGuides } from "@/lib/guide";
import type { GuideId, GuideSection } from "@/lib/guide";
import { partsFor } from "@/lib/parts";
import { readingMinutes } from "@/lib/reading";

/** One topic of a guide as the Materials screens use it. */
export type Topic = {
  guideId: GuideId;
  guideTitle: string;
  section: GuideSection;
  id: string;
  title: string;
  minutes: number;
  /** The next topic of the same guide; null on the last. */
  next: Topic | null;
};

/** Every topic of every guide, in the order of Materials (the evacuation guide, then the flood guide). */
export function allTopics(): Topic[] {
  return loadGuides().flatMap((guide) => {
    const topics: Topic[] = guide.sections.map((section) => ({
      guideId: guide.id,
      guideTitle: guide.title,
      section,
      id: section.id,
      title: section.title,
      minutes: readingMinutes(section.body),
      next: null,
    }));
    topics.forEach((topic, index) => (topic.next = topics[index + 1] ?? null));
    return topics;
  });
}

export function topicFor(id: string): Topic | undefined {
  return allTopics().find((topic) => topic.id === id);
}

/**
 * Where "Practise this topic" goes: Training at the topic, in Scenario mode when it has scenario
 * parts and otherwise in Quiz mode. Null for a topic with no Training parts (the flood topics).
 */
export function practiseHref(topicId: string): string | null {
  const has = (mode: "scenario" | "quiz") =>
    partsFor(mode).some((part) => part.sectionId === topicId);
  if (has("scenario")) return `/training?mode=scenario&topic=${topicId}`;
  if (has("quiz")) return `/training?mode=quiz&topic=${topicId}`;
  return null;
}

/** The first Quick checklist that covers a topic, or nothing. */
export function stepsFor(topicId: string) {
  return checklists.find((checklist) => checklist.guideRef.includes(topicId));
}
