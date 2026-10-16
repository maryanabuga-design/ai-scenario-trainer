import { describe, expect, it } from "vitest";
import {
  chunkIds,
  getPart,
  modeItems,
  PART_SIZE,
  partsFor,
  sectionsWithParts,
  trainingSections,
} from "@/lib/parts";
import { questions } from "@/lib/quiz";
import { scenario } from "@/lib/scenario";

describe("parts", () => {
  it("has one named size: 10", () => {
    expect(PART_SIZE).toBe(10);
  });

  it("covers the guide sections S1 to S10", () => {
    expect(trainingSections).toEqual(["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10"]);
  });

  it("splits each section's questions into chunks of PART_SIZE, a small section into one part", () => {
    for (const mode of ["scenario", "quiz"] as const) {
      const parts = partsFor(mode);
      for (const sectionId of sectionsWithParts(mode)) {
        const own = parts.filter((part) => part.sectionId === sectionId);
        const count = modeItems(mode).filter((item) => item.section === sectionId).length;
        expect(own, `${mode} ${sectionId}`).toHaveLength(Math.ceil(count / PART_SIZE));
        own.forEach((part, index) => {
          expect(part.n).toBe(index + 1);
          expect(part.itemIds.length).toBeLessThanOrEqual(PART_SIZE);
          if (index < own.length - 1) expect(part.itemIds).toHaveLength(PART_SIZE);
        });
        expect(own.flatMap((part) => part.itemIds)).toHaveLength(count);
      }
    }
    // every section of the guide has fewer than 5 quiz questions here: one part each
    expect(partsFor("quiz").every((part) => part.n === 1)).toBe(true);
  });

  it("chunks ids by PART_SIZE: 12 ids make 3 parts, 3 ids one, none make none", () => {
    const ids = Array.from({ length: 12 }, (_, index) => `q${index}`);
    expect(chunkIds(ids).map((chunk) => chunk.length)).toEqual([10, 2]);
    expect(chunkIds(ids.slice(0, 3))).toHaveLength(1);
    expect(chunkIds(ids.slice(0, 10))).toHaveLength(1);
    expect(chunkIds(ids.slice(0, 11)).map((chunk) => chunk.length)).toEqual([10, 1]);
    const thirty = Array.from({ length: 30 }, (_, index) => `q${index}`);
    expect(chunkIds(thirty).map((chunk) => chunk.length)).toEqual([10, 10, 10]);
    expect(chunkIds(thirty.slice(0, 20)).map((chunk) => chunk.length)).toEqual([10, 10]);
    expect(chunkIds([])).toEqual([]);
  });

  it("names a part <mode>:<section>:<n>", () => {
    expect(partsFor("quiz")[0].id).toBe("quiz:S1:1");
    expect(partsFor("scenario")[0].id).toBe("scenario:S1:1");
    partsFor("quiz").forEach((part) => expect(part.id).toBe(`quiz:${part.sectionId}:${part.n}`));
  });

  it("keeps scenario parts in story order and quiz parts in the fixed bank order", () => {
    const steps = scenario.steps.map((step) => step.id);
    const s2 = partsFor("scenario")
      .filter((part) => part.sectionId === "S2")
      .flatMap((part) => part.itemIds);
    expect(s2).toEqual(steps.filter((id) => s2.includes(id)));
    expect(s2).toEqual(["s2", "s3", "s8"]);
    const s1steps = partsFor("scenario")
      .filter((part) => part.sectionId === "S1")
      .flatMap((part) => part.itemIds);
    expect(s1steps).toEqual(steps.filter((id) => s1steps.includes(id)));
    expect(s1steps[0]).toBe("s1");
    const bank = questions.map((question) => question.id);
    const s1 = partsFor("quiz")
      .filter((part) => part.sectionId === "S1")
      .flatMap((part) => part.itemIds);
    expect(s1).toEqual(bank.filter((id) => s1.includes(id)));
    expect(partsFor("quiz")).toEqual(partsFor("quiz"));
  });

  it("lists only sections that have questions in the mode, and every question once", () => {
    expect(sectionsWithParts("scenario")).toEqual(["S1", "S2", "S4", "S5", "S6"]);
    expect(sectionsWithParts("quiz")).toEqual(trainingSections);
    expect(partsFor("scenario").flatMap((part) => part.itemIds)).toHaveLength(
      modeItems("scenario").length,
    );
    expect(partsFor("quiz").flatMap((part) => part.itemIds)).toHaveLength(modeItems("quiz").length);
  });

  it("finds a part by id, and not an unknown one", () => {
    expect(getPart("quiz:S3:1")?.sectionId).toBe("S3");
    expect(getPart("quiz:S3:9")).toBeUndefined();
    expect(getPart("mixed:S1:1")).toBeUndefined();
  });
});
