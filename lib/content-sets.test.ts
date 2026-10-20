import { beforeEach, describe, expect, it } from "vitest";
import { sampleQuestions } from "@/lib/content-import";
import {
  addSet,
  cleanSets,
  imageBytes,
  imageFits,
  itemsOf,
  readSets,
  removeSet,
  saveSets,
  toItem,
  updateSet,
} from "@/lib/content-sets";
import type { ContentSet } from "@/lib/content-sets";
import { examReadiness, scopeItemIds } from "@/lib/readiness";
import { findItem } from "@/lib/items";
import { modeItems } from "@/lib/parts";
import { readinessOf, modeStats } from "@/lib/part-progress";
import { weakItemsFromHistory } from "@/lib/progress";
import { questions as bank } from "@/lib/quiz";
import type { FinishedSession } from "@/lib/session";

const make = (status: ContentSet["status"] = "published", id = "cabc"): ContentSet => ({
  id,
  title: "Evacuation routes",
  topic: "S3",
  status,
  source: "sample",
  fileName: "q.docx",
  createdAt: 1,
  dropped: 0,
  questions: sampleQuestions(id).map((q) =>
    q.explanation === "" ? { ...q, explanation: "Because." } : { ...q, correct: q.correct ?? "a" },
  ),
});

beforeEach(() => saveSets([]));

describe("saved sets", () => {
  it("are cleaned: a broken set or question is dropped and nothing throws", () => {
    expect(cleanSets("nope")).toBeNull();
    const set = make();
    const cleaned = cleanSets([
      null,
      { id: "", title: "x", topic: "S1" },
      { ...set, topic: "S99" },
      { ...set, title: "  " },
      set,
      { ...set, title: "Duplicate id" },
      { ...make("draft", "c2"), questions: [null, 5, { id: "q", text: "t", options: "bad" }] },
    ])!;
    expect(cleaned.map((s) => s.id)).toEqual(["cabc", "c2"]);
    expect(cleaned[1].questions).toHaveLength(1);
    expect(cleaned[1].questions[0].options).toEqual(["", "", "", ""]);
    expect(cleaned[1].questions[0].correct).toBeNull();
  });

  it("keep only picture data URLs and cap text and the number of questions", () => {
    const base = make("draft").questions[0];
    const [cleaned] = cleanSets([
      {
        ...make("draft"),
        questions: [
          { ...base, image: { data: "https://example.com/x.png", alt: "x" } },
          { ...base, id: "b", image: { data: "data:image/png;base64,AAAA", alt: "ok" } },
          ...Array.from({ length: 200 }, (_, i) => ({ ...base, id: `n${i}` })),
        ],
      },
    ])!;
    expect(cleaned.questions).toHaveLength(100);
    expect(cleaned.questions[0].image).toBeUndefined();
    expect(cleaned.questions[1].image?.alt).toBe("ok");
  });

  it("are saved, changed and removed one set at a time", () => {
    addSet(make("draft", "c1"));
    addSet(make("draft", "c2"));
    expect(readSets().map((s) => s.id)).toEqual(["c2", "c1"]);
    updateSet("c1", (s) => ({ ...s, status: "published" }));
    expect(readSets().find((s) => s.id === "c1")!.status).toBe("published");
    removeSet("c2");
    expect(readSets().map((s) => s.id)).toEqual(["c1"]);
  });

  it("measure a picture by its base64 size", () => {
    const small = `data:image/png;base64,${"A".repeat(4000)}`;
    expect(imageBytes(small)).toBe(3000);
    expect(imageFits(small)).toBe(true);
    expect(imageFits(`data:image/png;base64,${"A".repeat(500_000)}`)).toBe(false);
  });
});

describe("a published set on the Student side", () => {
  it("makes items in the one shape, marked imported, with ids that never meet the bank", () => {
    const set = make();
    const items = itemsOf(set);
    expect(items).toHaveLength(20);
    const [first] = items;
    expect(first).toMatchObject({ kind: "question", section: "S3", imported: true });
    expect(first.id).toBe("imp-cabc-1");
    expect(first.options.length).toBeGreaterThanOrEqual(2);
    expect(first.options.some((o) => o.id === first.correctOptionId)).toBe(true);
    expect(bank.some((q) => q.id.startsWith("imp-"))).toBe(false);
    expect(
      toItem(set, { ...set.questions[0], image: { data: "data:image/png;base64,AA", alt: "A" } })
        .image,
    ).toEqual({ src: "data:image/png;base64,AA", alt: "A" });
  });

  it("is found by id only while the set is published", () => {
    addSet(make("draft"));
    expect(findItem("imp-cabc-1")).toBeUndefined();
    updateSet("cabc", (s) => ({ ...s, status: "published" }));
    expect(findItem("imp-cabc-1")?.imported).toBe(true);
    updateSet("cabc", (s) => ({ ...s, status: "draft" }));
    expect(findItem("imp-cabc-1")).toBeUndefined();
    expect(findItem("q-quiz-s01-001")?.imported).toBeUndefined();
  });

  it("never enters the bank, the parts, the exam pool, readiness or Weak topics", () => {
    addSet(make());
    const history = (ids: string[], correct: boolean): FinishedSession => ({
      kind: "quiz",
      itemIds: ids,
      answers: ids.map((itemId) => ({
        itemId,
        optionId: correct ? findItem(itemId)!.correctOptionId : "zz",
      })),
      finishedAt: 10,
    });
    const builtIn = modeItems("quiz")[0].id;
    const imported = itemsOf(readSets()[0]).map((i) => i.id);
    // the pools are the built-in ones
    for (const mode of ["scenario", "quiz"] as const) {
      expect(modeItems(mode).some((i) => i.id.startsWith("imp-"))).toBe(false);
    }
    expect(scopeItemIds(["S3", "S1"]).some((id) => id.startsWith("imp-"))).toBe(false);
    // answers to imported questions (all wrong, all right) change no figure
    const plain = [history([builtIn], true)];
    for (const extra of [history(imported, false), history(imported, true)]) {
      const mixed = [...plain, { ...extra, finishedAt: 20 }];
      expect(readinessOf(mixed)).toBe(readinessOf(plain));
      expect(modeStats(mixed, "quiz")).toEqual(modeStats(plain, "quiz"));
      expect(examReadiness(["S3"], mixed)).toBe(examReadiness(["S3"], plain));
      expect(weakItemsFromHistory(mixed).map((w) => w.id)).toEqual(
        weakItemsFromHistory(plain).map((w) => w.id),
      );
    }
  });
});
