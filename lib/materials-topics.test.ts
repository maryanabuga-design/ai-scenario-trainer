import { describe, expect, it } from "vitest";
import { loadGuides } from "@/lib/guide";
import { allTopics, stepsFor, topicFor } from "@/lib/materials-topics";
import { readingMinutes } from "@/lib/reading";

describe("the reading topics", () => {
  it("are 17: the 10 evacuation and the 7 flood topics, each with a reading time and a next topic in its guide", () => {
    const topics = allTopics();
    expect(topics).toHaveLength(17);
    expect(topics.filter((topic) => topic.guideId === "evacuation")).toHaveLength(10);
    expect(topics.filter((topic) => topic.guideId === "flood")).toHaveLength(7);
    for (const topic of topics) {
      expect(topic.minutes).toBe(readingMinutes(topic.section.body));
      expect(topic.minutes).toBeGreaterThanOrEqual(1);
    }
    expect(topicFor("S1")?.next?.id).toBe("S2");
    expect(topicFor("S10")?.next).toBeNull();
    expect(topicFor("F7")?.next).toBeNull();
    expect(topicFor("F1")?.next?.id).toBe("F2");
    expect(topicFor("S10")?.guideTitle).toBe(loadGuides()[0].title);
    expect(topicFor("nope")).toBeUndefined();
  });

  it("knows the previous and the next topic inside one guide", () => {
    expect(topicFor("S1")?.previous).toBeNull();
    expect(topicFor("S2")?.previous?.id).toBe("S1");
    expect(topicFor("S10")?.next).toBeNull();
    expect(topicFor("S10")?.previous?.id).toBe("S9");
    // the guides do not run into each other
    expect(topicFor("F1")?.previous).toBeNull();
    expect(topicFor("F7")?.next).toBeNull();
  });

  it("opens the Steps for a topic, and nothing when no checklist covers it", () => {
    expect(stepsFor("S1")?.id).toBe("leaving-a-building");
    expect(stepsFor("S7")?.id).toBe("severe-bleeding");
    expect(stepsFor("S8")?.id).toBe("burns");
    expect(stepsFor("S9")).toBeUndefined();
    expect(stepsFor("F2")).toBeUndefined();
  });
});
