import { describe, expect, it } from "vitest";
import { practicePlan } from "@/lib/practise";
import { canPractise, partsFor, practiceParts } from "@/lib/parts";
import type { PartRecords } from "@/lib/part-progress";

const record = {
  lastPercent: 80,
  attempts: 1,
  answeredIds: [],
  correctIds: [],
};

describe("what a topic can practise", () => {
  it("plays the scenario parts when the topic has scenario steps, and its quiz otherwise", () => {
    expect(practiceParts("S1").every((part) => part.mode === "scenario")).toBe(true);
    expect(practiceParts("S1").length).toBeGreaterThan(0);
    expect(practiceParts("S3").every((part) => part.mode === "quiz")).toBe(true);
    expect(practiceParts("S3").length).toBeGreaterThan(0);
  });

  it("has nothing for the flood topics, so the button is hidden", () => {
    expect(canPractise("S1")).toBe(true);
    expect(canPractise("F1")).toBe(false);
    expect(practicePlan("F1", null, null)).toBeNull();
  });
});

describe("what Practise this topic does", () => {
  const first = partsFor("scenario").find((part) => part.sectionId === "S1")!;

  it("starts the first part of a topic that was never practised", () => {
    expect(practicePlan("S1", null, null)).toEqual({
      part: first,
      resume: false,
    });
  });

  it("resumes an unfinished session of this topic", () => {
    expect(practicePlan("S1", null, { partId: first.id, finished: false })).toEqual({
      part: first,
      resume: true,
    });
  });

  it("does not resume a session of another topic or a finished one", () => {
    const other = partsFor("scenario").find((part) => part.sectionId === "S2");
    const partId = other?.id ?? "quiz:S3:1";
    expect(practicePlan("S1", null, { partId, finished: false })?.resume).toBe(false);
    expect(practicePlan("S1", null, { partId: first.id, finished: true })?.resume).toBe(false);
  });

  it("starts the next part that is not done, and the first again when all are done", () => {
    const own = practiceParts("S3");
    const records: PartRecords = { [own[0].id]: record };
    const plan = practicePlan("S3", records, null)!;
    expect(plan.part.id).toBe((own[1] ?? own[0]).id);
    const all: PartRecords = Object.fromEntries(own.map((part) => [part.id, record]));
    expect(practicePlan("S3", all, null)).toEqual({
      part: own[0],
      resume: false,
    });
  });
});
