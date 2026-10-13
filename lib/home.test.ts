import { describe, expect, it } from "vitest";
import { currentCard, dotCount, homeScenarios, nextUp, scenarioLine, topicRow } from "@/lib/home";
import { sampleMaterials } from "@/lib/materials";
import { getScenario } from "@/lib/scenario";
import { materialFromSample, sampleFiles } from "@/lib/training";
import { getStep } from "@/lib/scenario";
import { scoreStep } from "@/lib/scoring";
import type { RepeatSession, ScenarioSession } from "@/lib/session";
import { weakTopics } from "@/lib/weak-topics";
import type { WeakTopic } from "@/lib/weak-topics";

// s2 c unsure: guess on S2; s5 a unsure: knowledge gap on S5.
const topics = weakTopics([scoreStep(getStep("s2"), "c", 2), scoreStep(getStep("s5"), "a", 1)]);
const s2 = topics.find((topic) => topic.sectionId === "S2")!;

const repeatRound = (sectionIds: string[], answered: number): RepeatSession => ({
  kind: "repeat",
  topics: sectionIds,
  items: [
    { type: "step", id: "s2" },
    { type: "question", id: "q-s2-1" },
  ],
  index: answered,
  phase: "decide",
  answers: Array.from({ length: answered }, () => ({
    type: "step" as const,
    stepId: "s2",
    optionId: "c",
    confidence: 3 as const,
    explanation: "",
  })),
  finished: false,
});

const scenarioSession: ScenarioSession = {
  mode: "full",
  stepIds: ["s1", "s2", "s3", "s4", "s5", "s6"],
  index: 2,
  phase: "decide",
  answers: [],
  finished: false,
};

describe("Next up", () => {
  it("continues an unfinished session first", () => {
    expect(nextUp({ unfinished: scenarioSession, topics, hasHistory: true })).toEqual({
      kind: "continue",
      title: "Continue your full session",
      detail: "Step 3 of 6",
      action: "Continue",
      linksToTopics: false,
    });
    const round = nextUp({ unfinished: repeatRound(["S2"], 0), topics, hasHistory: true });
    expect(round.title).toBe("Continue your repeat round");
    expect(round.detail).toBe("Item 1 of 2");
  });

  it("then offers the weak topics with a breakdown, linking to the Weak topics page", () => {
    expect(nextUp({ unfinished: null, topics, hasHistory: true })).toEqual({
      kind: "repeat",
      title: "2 topics to repeat",
      detail: "1 knowledge gap, 1 guess",
      action: "Repeat weak topics",
      linksToTopics: true,
    });
    expect(nextUp({ unfinished: null, topics: [s2], hasHistory: true }).title).toBe(
      "1 topic to repeat",
    );
  });

  it("starts the first scenario when there are no sessions yet", () => {
    const first = nextUp({ unfinished: null, topics: [], hasHistory: false });
    expect(first.kind).toBe("first");
    expect(first.title).toBe("Start your first scenario");
    expect(first.action).toBe("Start a scenario");
    expect(first.linksToTopics).toBe(false);
  });

  it("is ready for a new scenario when every topic has been repeated", () => {
    const ready = nextUp({ unfinished: null, topics: [], hasHistory: true });
    expect(ready.kind).toBe("new");
    expect(ready.title).toBe("Ready for a new scenario");
    expect(ready.action).toBe("Start a scenario");
  });
});

describe("topic row and dots", () => {
  const many: WeakTopic[] = Array.from({ length: 7 }, (_, index) => ({
    ...s2,
    sectionId: `S${index + 1}`,
  }));

  it("shows at most five cards and one dot per card", () => {
    expect(topicRow(many)).toHaveLength(5);
    expect(dotCount(many)).toBe(5);
    expect(dotCount(topics)).toBe(2);
    expect(dotCount([])).toBe(0);
  });

  it("moves the current dot with the card in view, and to the last dot at the end", () => {
    const row = { step: 300, maxScroll: 700, count: 3 };
    expect(currentCard({ ...row, scrollLeft: 0 })).toBe(0);
    expect(currentCard({ ...row, scrollLeft: 140 })).toBe(0);
    expect(currentCard({ ...row, scrollLeft: 160 })).toBe(1);
    expect(currentCard({ ...row, scrollLeft: 300 })).toBe(1);
    expect(currentCard({ ...row, scrollLeft: 699 })).toBe(2);
    expect(currentCard({ ...row, scrollLeft: 5000 })).toBe(2);
  });
});

describe("New scenario cards", () => {
  const upload = (index: number) => materialFromSample(sampleFiles[index], new Date("2026-10-08"));

  it("shows the sample guide, and the flood guide once it is uploaded and ready", () => {
    expect(homeScenarios(sampleMaterials).map((material) => material.id)).toEqual([
      "evacuation-guide",
    ]);
    const flood = { ...upload(1), status: "ready" as const };
    const cards = homeScenarios([...sampleMaterials, flood]);
    expect(cards.map((material) => material.scenarioId)).toEqual([
      "building-evacuation-001",
      "flood-preparedness-001",
    ]);
  });

  it("adds no card for a re-uploaded guide, a short quick card or a processing file", () => {
    const copy = { ...upload(0), status: "ready" as const };
    const quickCard = { ...upload(2), status: "ready" as const };
    const processing = { ...upload(1), status: "processing" as const };
    expect(homeScenarios([...sampleMaterials, copy, quickCard, processing])).toHaveLength(1);
  });

  it("describes only the Short length, from the scenario data", () => {
    const evacuation = getScenario("building-evacuation-001");
    const short = evacuation.lengths.short!;
    expect(scenarioLine(evacuation)).toBe(
      `Short: ${short.stepIds.length} decisions, about ${short.minutes} min.`,
    );
    expect(scenarioLine(evacuation)).toBe("Short: 3 decisions, about 5 min.");
    expect(scenarioLine(getScenario("flood-preparedness-001"))).toBe(
      "Short: 3 decisions, about 5 min.",
    );
  });
});
