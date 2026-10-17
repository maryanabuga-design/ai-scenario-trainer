import { describe, expect, it } from "vitest";
import { checklists } from "@/lib/checklists";
import {
  cleanStepsProgress,
  doneCount,
  doneIds,
  doneLabel,
  listLine,
  toggled,
} from "@/lib/steps-progress";

const guide = checklists[0];
const [a, b, c] = guide.steps.map((step) => step.id);

describe("steps progress", () => {
  it("toggles a step on and off", () => {
    const one = toggled(null, guide, b);
    expect(one).toEqual({ [guide.id]: [b] });
    const two = toggled(one, guide, a);
    expect(doneIds(two, guide)).toEqual([a, b]);
    expect(toggled(two, guide, a)).toEqual({ [guide.id]: [b] });
    expect(toggled(one, guide, b)).toEqual({});
  });

  it("counts the done steps and words them", () => {
    const saved = { [guide.id]: [a, c] };
    expect(doneCount(saved, guide)).toBe(2);
    expect(doneLabel(2, 5)).toBe("2 of 5 steps done");
    expect(listLine(2, 5)).toBe("5 steps · 2 done");
    expect(listLine(0, 1)).toBe("1 step · 0 done");
  });

  it("ignores unknown ids and unknown guides", () => {
    const saved = { [guide.id]: [a, "nope", 7, null], ghost: [a] };
    expect(doneIds(saved, guide)).toEqual([a]);
    expect(cleanStepsProgress(saved)).toEqual({ [guide.id]: [a] });
    expect(toggled(saved, guide, "nope")).toEqual({ [guide.id]: [a] });
  });

  it("tolerates broken stored data", () => {
    for (const broken of [
      null,
      undefined,
      5,
      "x",
      [],
      [1, 2],
      { [guide.id]: "a" },
      { [guide.id]: {} },
    ]) {
      expect(doneIds(broken, guide)).toEqual([]);
      expect(doneCount(broken, guide)).toBe(0);
      expect(() => toggled(broken, guide, a)).not.toThrow();
    }
    expect(cleanStepsProgress("x")).toBeNull();
    expect(cleanStepsProgress({})).toBeNull();
  });
});
