import { checklists } from "@/lib/checklists";
import { loadGuides } from "@/lib/guide";
import type { GuideId, GuideSection } from "@/lib/guide";
import { readingMinutes } from "@/lib/reading";

/** One topic of a guide as the Materials screens use it. */
export type Topic = {
  guideId: GuideId;
  guideTitle: string;
  section: GuideSection;
  id: string;
  title: string;
  minutes: number;
  /** The previous topic of the same guide; null on the first. */
  previous: Topic | null;
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
      previous: null,
      next: null,
    }));
    topics.forEach((topic, index) => {
      topic.previous = topics[index - 1] ?? null;
      topic.next = topics[index + 1] ?? null;
    });
    return topics;
  });
}

export function topicFor(id: string): Topic | undefined {
  return allTopics().find((topic) => topic.id === id);
}

/** The first Quick checklist that covers a topic, or nothing. */
export function stepsFor(topicId: string) {
  return checklists.find((checklist) => checklist.guideRef.includes(topicId));
}
