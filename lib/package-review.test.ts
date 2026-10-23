import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { confirmed, getItem, imageProblem, setItem, withImage } from "@/lib/package-edit";
import { checkPackage, readPackage } from "@/lib/package-read";
import type { PackageFile } from "@/lib/package-read";
import {
  flaggedItems,
  itemName,
  keyOfSlug,
  keySlug,
  needsSentence,
  nextRound,
  nothingFlagged,
  parseKey,
  partCounts,
  pillOf,
  reviewLabel,
  tabOfKey,
} from "@/lib/package-review";

const DIR = "public/templates/sample-package";
const sample = (name: string): PackageFile => {
  const bytes = readFileSync(`${DIR}/${name}`);
  return name.endsWith(".png")
    ? {
        name,
        size: bytes.length,
        dataUrl: `data:image/png;base64,${bytes.toString("base64")}`,
      }
    : { name, size: bytes.length, text: bytes.toString("utf8") };
};
const clean = readPackage(
  ["guide", "steps", "scenario", "questions"]
    .map((n) => sample(`${n}.csv`))
    .concat([sample("exit-sign.png"), sample("assembly-point.png")]),
).data;
const bad = readPackage(
  ["guide.csv", "steps-with-problems.csv", "questions-with-problems.csv"]
    .map(sample)
    .concat([sample("exit-sign.png"), sample("assembly-point.png")]),
).data;

describe("flagged items and pills", () => {
  it("a clean package has nothing flagged: no pill, nothing to confirm", () => {
    expect(flaggedItems(checkPackage(clean))).toEqual([]);
    expect(nothingFlagged(checkPackage(clean))).toBe(true);
    expect(pillOf(checkPackage(clean), "questions:0")).toBeNull();
  });

  it("a must fix item has the attention pill with its most important issue; items without issues have none", () => {
    const issues = checkPackage(bad);
    expect(pillOf(issues, "steps:0:2")).toEqual({
      text: "Guide section 7 does not exist",
      kind: "must",
    });
    expect(pillOf(issues, "steps:0:1")).toBeNull();
    expect(pillOf(issues, "questions:3")).toEqual({
      text: "No correct answer",
      kind: "must",
    });
    expect(nothingFlagged(issues)).toBe(false);
    expect(partCounts(flaggedItems(issues))).toBe("Steps 2 · Quiz 4");
  });

  it("an item with several issues shows the first must fix and is counted once", () => {
    const data = {
      ...clean,
      questions: clean.questions!.map((q, i) =>
        i === 0 ? { ...q, explanation: "", correct: null } : q,
      ),
    };
    const items = flaggedItems(checkPackage(data));
    expect(items).toHaveLength(1);
    expect(items[0].issues.length).toBeGreaterThan(1);
    expect(pillOf(checkPackage(data), "questions:0")?.kind).toBe("must");
  });

  it("an automatically matched guide section is Please confirm: it does not block by itself, it counts as an item, Mark as OK clears it", () => {
    const data = {
      ...clean,
      questions: clean.questions!.map((q, i) => (i === 1 ? { ...q, refAuto: true } : q)),
    };
    const issues = checkPackage(data);
    expect(pillOf(issues, "questions:1")).toEqual({
      text: "Please confirm",
      kind: "confirm",
    });
    expect(issues.filter((issue) => issue.blocking)).toHaveLength(0);
    expect(flaggedItems(issues)).toHaveLength(1);
    expect(nothingFlagged(issues)).toBe(false);
    // Mark as OK: the saved item is confirmed
    const item = confirmed(getItem(data, "questions:1")!);
    const after = setItem(data, "questions:1", item);
    expect(checkPackage(after).some((issue) => issue.kind === "confirm")).toBe(false);
    expect(nothingFlagged(checkPackage(after))).toBe(true);
    // must fix before please confirm on one item
    const both = {
      ...data,
      questions: data.questions!.map((q, i) => (i === 1 ? { ...q, explanation: "" } : q)),
    };
    expect(pillOf(checkPackage(both), "questions:1")?.kind).toBe("must");
  });

  it("fixing an item removes its pill", () => {
    const issues = checkPackage(bad);
    const key = "questions:3";
    const fixed = setItem(bad, key, {
      ...getItem(bad, key)!,
      correct: "b",
    } as never);
    expect(pillOf(checkPackage(fixed), key)).toBeNull();
    expect(flaggedItems(checkPackage(fixed))).toHaveLength(flaggedItems(issues).length - 1);
  });

  it("labels the button 'Review N items' with the number of items still flagged", () => {
    expect(reviewLabel(6)).toBe("Review 6 items");
    expect(reviewLabel(1)).toBe("Review 1 item");
  });
});

describe("item keys and edits", () => {
  it("turns keys into address parts and back, refusing anything else", () => {
    expect(keySlug("steps:0:2")).toBe("steps-0-2");
    expect(keyOfSlug("steps-0-2")).toBe("steps:0:2");
    expect(keyOfSlug("questions-3")).toBe("questions:3");
    expect(keyOfSlug("guide-all")).toBe("guide:all");
    expect(keyOfSlug("steps-0-all")).toBe("steps:0:all");
    for (const bad of ["", "quiz-1", "steps-1", "questions-1-2", "../x", "guide-1;rm"]) {
      expect(keyOfSlug(bad), bad).toBeNull();
    }
    expect(tabOfKey("questions:3")).toBe("quiz");
    expect(tabOfKey("steps:0:1")).toBe("steps");
  });

  it("finds, names and replaces an item of every part without touching the others", () => {
    expect(parseKey(clean, "guide:1")).toEqual({ part: "guide", index: 1 });
    expect(parseKey(clean, "steps:1:0")).toEqual({
      part: "steps",
      list: 1,
      index: 0,
    });
    expect(parseKey(clean, "scenario:9")).toBeNull();
    expect(itemName(clean, "guide:1")).toBe("Guide section 2");
    expect(itemName(clean, "steps:0:2")).toContain("Step 3 of");
    expect(itemName(clean, "scenario:0")).toBe("Scenario step 1");
    expect(itemName(clean, "questions:3")).toBe("Question 4");
    for (const key of ["guide:0", "steps:0:0", "scenario:0", "questions:0"]) {
      const item = getItem(clean, key)!;
      const next = setItem(clean, key, { ...item, alt: "changed" } as never);
      expect(JSON.stringify(next)).not.toBe(JSON.stringify(clean));
      expect(JSON.stringify(setItem(next, key, item))).toBe(JSON.stringify(clean));
    }
  });

  it("adds a picture within the budget and refuses a wrong type, a large file and a seventh picture", () => {
    expect(imageProblem(clean, { name: "new.png", size: 1000 })).toBeNull();
    expect(imageProblem(clean, { name: "notes.pdf", size: 10 })).toContain("not a png");
    expect(imageProblem(clean, { name: "big.png", size: 320 * 1024 })).toContain(
      "larger than 300 KB",
    );
    let full = clean;
    for (let n = 0; n < 6; n += 1)
      full = withImage(full, `p${n}.png`, {
        data: "data:image/png;base64,AA",
        size: 10,
      });
    expect(Object.keys(full.images).length).toBeGreaterThanOrEqual(6);
    expect(imageProblem(full, { name: "seventh.png", size: 10 })).toContain("at most");
    expect(
      withImage(clean, "EXIT-SIGN.png", { data: "x", size: 1 }).images["EXIT-SIGN.png"],
    ).toBeDefined();
  });

  it("an image description (alt text) is a must fix until it is added", () => {
    const data = {
      ...clean,
      questions: clean.questions!.map((q, i) =>
        i === 0 ? { ...q, imageFile: "exit-sign.png", alt: "" } : q,
      ),
    };
    expect(pillOf(checkPackage(data), "questions:0")?.text).toBe(
      "Image exit-sign.png has no alt text",
    );
    const fixed = setItem(data, "questions:0", {
      ...getItem(data, "questions:0")!,
      alt: "A green exit sign",
    } as never);
    expect(pillOf(checkPackage(fixed), "questions:0")).toBeNull();
  });
});

describe("resolving an item in the guided review", () => {
  const bad = readPackage(
    ["guide", "steps-with-problems", "scenario", "questions-with-problems"]
      .map((n) => sample(`${n}.csv`))
      .concat([sample("exit-sign.png")]),
  ).data;
  const image = (data: typeof bad) =>
    flaggedItems(checkPackage(data)).find((i) => i.primary.reason.includes("was not selected"))!;

  it("keeps a picture-file problem after a save with the file still missing, and says what is needed", () => {
    const item = image(bad);
    const saved = setItem(bad, item.key, confirmed(getItem(bad, item.key)!));
    expect(flaggedItems(checkPackage(saved)).some((i) => i.key === item.key)).toBe(true);
    expect(needsSentence(item.issues.filter((i) => i.kind === "must"))).toBe(
      "Choose the image file or remove the image to continue.",
    );
  });

  it("resolves it once the picture is chosen or removed, and the count drops", () => {
    const item = image(bad);
    const before = flaggedItems(checkPackage(bad)).length;
    const removed = setItem(bad, item.key, {
      ...getItem(bad, item.key)!,
      imageFile: "",
      alt: "",
    } as never);
    expect(flaggedItems(checkPackage(removed)).some((i) => i.key === item.key)).toBe(false);
    expect(flaggedItems(checkPackage(removed)).length).toBe(before - 1);
  });

  it("Mark as OK resolves a please-confirm item", () => {
    const base = readPackage(
      ["guide", "steps", "scenario", "questions"]
        .map((n) => sample(`${n}.csv`))
        .concat([sample("exit-sign.png"), sample("assembly-point.png")]),
    ).data;
    const auto = {
      ...base,
      questions: base.questions!.map((q, i) => (i === 1 ? { ...q, refAuto: true } : q)),
    };
    expect(flaggedItems(checkPackage(auto)).map((i) => i.key)).toEqual(["questions:1"]);
    const ok = setItem(auto, "questions:1", confirmed(getItem(auto, "questions:1")!));
    expect(nothingFlagged(checkPackage(ok))).toBe(true);
  });

  it("keeps the visited items in the round and moves on to the next one still flagged", () => {
    const round = ["a", "b", "c", "d"];
    expect(nextRound(round, 0, new Set(["b", "d"]))).toEqual({
      round: ["a", "b", "d"],
      next: 1,
    });
    expect(nextRound(round, 3, new Set(["a"]))).toEqual({ round, next: null });
  });

  it("has a sentence for the other must fixes and none when nothing blocks", () => {
    const issue = (reason: string) => ({ reason }) as never;
    expect(needsSentence([])).toBe("");
    expect(needsSentence([issue("Image a.png has no alt text")])).toBe(
      "Add an image description to continue.",
    );
    expect(needsSentence([issue("No title")])).toBe("Fix the point above to continue.");
    expect(needsSentence([issue("No title"), issue("No text")])).toBe(
      "Fix the points above to continue.",
    );
  });
});
