import { describe, expect, it } from "vitest";
import { getItem } from "@/lib/items";
import { scoreSession, weakItemsFromHistory } from "@/lib/progress";
import { repeatItemIds, toRepeatLabel, topicsToRepeat, weakTopics } from "@/lib/weak-topics";
import { materialForSection, topicIcon, topicTint } from "@/lib/weak-topics";
import { currentWeakItems, scoreItem } from "@/lib/scoring";
import type { FinishedSession } from "@/lib/session";

// s1 d wrong (S1), s2 c right, s3 b wrong (S2), s4 a wrong (S6), s5 a wrong (S5), q-s1-1 a wrong (S1).
const items = [
  scoreItem(getItem("s1"), "d"),
  scoreItem(getItem("s2"), "c"),
  scoreItem(getItem("s3"), "b"),
  scoreItem(getItem("s4"), "a"),
  scoreItem(getItem("s5"), "a"),
  scoreItem(getItem("q-s1-1"), "a"),
];

describe("weak topics", () => {
  it("makes one topic per guide section with at least one wrong answer", () => {
    const topics = weakTopics(items);
    expect(topics.map((topic) => topic.sectionId).sort()).toEqual(["S1", "S2", "S5", "S6"]);
    expect(topics.find((topic) => topic.sectionId === "S1")?.items).toHaveLength(2);
  });

  it("leaves out sections where every answer was right", () => {
    expect(weakTopics([scoreItem(getItem("s2"), "c")])).toEqual([]);
    expect(weakTopics([])).toEqual([]);
  });

  it("orders topics by how many answers are wrong, then by guide order", () => {
    expect(weakTopics(items).map((topic) => topic.sectionId)).toEqual(["S1", "S2", "S5", "S6"]);
  });

  it("counts the wrong answers of a topic and words them plainly, with no error types", () => {
    const [first] = weakTopics(items);
    expect(toRepeatLabel(first)).toBe("2 to repeat");
    expect(topicsToRepeat(6)).toBe("6 topics to repeat");
    expect(topicsToRepeat(1)).toBe("1 topic to repeat");
    expect(Object.keys(first).sort()).toEqual(["icon", "items", "sectionId"]);
  });

  it("brings back the questions answered wrong in the chosen sections, each once", () => {
    const topics = weakTopics(items);
    expect(repeatItemIds(topics)).toEqual(["s1", "q-s1-1", "s3", "s5", "s4"]);
    const chosen = topics.filter((topic) => ["S2", "S6"].includes(topic.sectionId));
    expect(repeatItemIds(chosen)).toEqual(["s3", "s4"]);
  });

  it("clears a topic once the latest answer to its questions is right", () => {
    const later = [...items, scoreItem(getItem("s3"), "a"), scoreItem(getItem("s1"), "b")];
    const sections = weakTopics(currentWeakItems(later)).map((topic) => topic.sectionId);
    expect(sections).not.toContain("S2");
    expect(sections).toContain("S1");
  });

  it("names the material behind a section", () => {
    expect(materialForSection("S3")).toBe("Evacuation guide");
    expect(materialForSection("F2")).toBe("Flood guide");
  });
});

describe("weak topics from the saved history", () => {
  const session = (finishedAt: number, picks: [string, string][]): FinishedSession => ({
    kind: "quiz",
    itemIds: picks.map(([id]) => id),
    answers: picks.map(([itemId, optionId]) => ({ itemId, optionId })),
    finishedAt,
  });

  it("uses the latest answer to each question, oldest session first", () => {
    const history = [
      session(2, [["s1", "b"]]),
      session(1, [
        ["s1", "d"],
        ["s4", "a"],
      ]),
    ];
    expect(weakItemsFromHistory(history).map((item) => item.id)).toEqual(["s4"]);
    expect(scoreSession(history[0])).toHaveLength(1);
    expect(weakItemsFromHistory(null)).toEqual([]);
  });
});

describe("topic look", () => {
  it("picks a topic icon by section, with a default", () => {
    expect(topicIcon("S2")).toBe("DoorOpen");
    expect(topicIcon("S3")).toBe("Wind");
    expect(topicIcon("S8")).toBe("Bandage");
    expect(topicIcon("F4")).toBe("Droplet");
    expect(topicIcon("X9")).toBe("BookOpen");
    expect(weakTopics(items).find((topic) => topic.sectionId === "S2")?.icon).toBe("DoorOpen");
  });

  it("takes the tile colour from the section, cycling yellow, blue, lilac, sage, peach", () => {
    expect(["S1", "S2", "S3", "S4", "S5"].map(topicTint)).toEqual([
      "yellow",
      "blue",
      "lilac",
      "green",
      "peach",
    ]);
    expect(topicTint("S6")).toBe("yellow");
    expect(topicTint("S10")).toBe("peach");
    expect(topicTint("F1")).toBe("yellow");
    expect(topicTint("F7")).toBe("blue");
  });

  it("keeps the same colour for a topic every time and has a safe default", () => {
    expect(topicTint("S3")).toBe(topicTint("S3"));
    expect(topicTint("X")).toBe("yellow");
  });
});
