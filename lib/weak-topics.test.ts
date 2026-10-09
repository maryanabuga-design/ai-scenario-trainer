import { describe, expect, it } from "vitest";
import { scoreSession } from "@/lib/progress";
import { getQuestion, scoreQuestion } from "@/lib/quiz";
import { getStep } from "@/lib/scenario";
import { scoreStep } from "@/lib/scoring";
import {
  countTopics,
  describeCounts,
  materialForSection,
  repeatItems,
  topicIcon,
  topicTone,
  weakTopics,
} from "@/lib/weak-topics";

// s2 c (correct) with confidence 2 is a guess on S2; s3 b with confidence 3 is a misconception on
// S2 and S3; s5 a with confidence 1 is a knowledge gap on S5; s1 b with confidence 3 is secure.
const items = [
  scoreStep(getStep("s1"), "b", 3),
  scoreStep(getStep("s2"), "c", 2),
  scoreStep(getStep("s3"), "b", 3),
  scoreStep(getStep("s5"), "a", 1),
  scoreQuestion(getQuestion("q-s5-3"), { type: "truefalse", value: true }, 2),
];

describe("weak topics", () => {
  const topics = weakTopics(items);

  it("makes one topic per guide section behind weak answers", () => {
    expect(topics.map((topic) => topic.sectionId).sort()).toEqual([
      "S2",
      "S3",
      "S5",
    ]);
  });

  it("gives each topic its most serious error type", () => {
    const s2 = topics.find((topic) => topic.sectionId === "S2");
    expect(s2?.errorType).toBe("misconception");
    expect(s2?.items.map((item) => item.id)).toEqual(["s2", "s3"]);
  });

  it("orders topics by priority, then by how many answers are weak", () => {
    expect(topics.map((topic) => [topic.sectionId, topic.errorType])).toEqual([
      ["S2", "misconception"],
      ["S3", "misconception"],
      ["S5", "knowledge_gap"],
    ]);
  });

  it("counts topics by error type and describes the counts", () => {
    expect(describeCounts(countTopics(topics))).toBe(
      "2 misconceptions, 1 knowledge gap",
    );
    expect(describeCounts(countTopics([]))).toBe("");
  });

  it("repeats both steps and questions from the topics, each once", () => {
    expect(repeatItems(topics)).toEqual([
      { type: "step", id: "s2" },
      { type: "step", id: "s3" },
      { type: "step", id: "s5" },
      { type: "question", id: "q-s5-3" },
    ]);
    expect(
      repeatItems(topics.filter((topic) => topic.sectionId === "S5")),
    ).toEqual([
      { type: "step", id: "s5" },
      { type: "question", id: "q-s5-3" },
    ]);
  });

  it("has no topics when everything is secure", () => {
    expect(weakTopics([scoreStep(getStep("s1"), "b", 3)])).toEqual([]);
  });

  it("names the material behind a section", () => {
    expect(materialForSection("S2")).toBe("Evacuation guide");
    expect(materialForSection("F5")).toBe("Flood guide");
  });
});

describe("repeat round", () => {
  it("scores a round that mixes steps and questions", () => {
    const scored = scoreSession({
      kind: "repeat",
      topics: ["S5"],
      finishedAt: 0,
      answers: [
        {
          type: "step",
          stepId: "s5",
          optionId: "b",
          confidence: 3,
          explanation: "",
        },
        {
          type: "question",
          questionId: "q-s5-3",
          response: { type: "truefalse", value: false },
          confidence: null,
        },
      ],
    });
    expect(scored.map((item) => [item.kind, item.id, item.correct])).toEqual([
      ["step", "s5", true],
      ["question", "q-s5-3", true],
    ]);
  });

  it("picks a topic icon by section, with a default", () => {
    expect(topicIcon("S2")).toBe("DoorOpen");
    expect(topicIcon("S3")).toBe("Wind");
    expect(topicIcon("S8")).toBe("Bandage");
    expect(topicIcon("F4")).toBe("Droplet");
    expect(topicIcon("X9")).toBe("BookOpen");
    expect(
      weakTopics(items).find((topic) => topic.sectionId === "S3")?.icon,
    ).toBe("Wind");
  });

  it("takes the tile colour from the material", () => {
    expect(topicTone("S5")).toBe("yellow");
    expect(topicTone("F2")).toBe("blue");
  });
});
