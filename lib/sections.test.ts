import { describe, expect, it } from "vitest";
import { deselectAll, keepOneHint, selectAll, selectionState, toggleSection } from "@/lib/sections";

const all = ["S1", "S2", "S3"];

describe("select and deselect all", () => {
  it("disables Select all when everything is selected", () => {
    expect(selectionState(all, all)).toEqual({ canSelectAll: false, canDeselectAll: true });
  });

  it("disables Deselect all when nothing is selected", () => {
    expect(selectionState(all, [])).toEqual({ canSelectAll: true, canDeselectAll: false });
  });

  it("allows both with part of the list selected", () => {
    expect(selectionState(all, ["S2"])).toEqual({ canSelectAll: true, canDeselectAll: true });
  });

  it("selects every section in list order, or none", () => {
    expect(selectAll(all)).toEqual(["S1", "S2", "S3"]);
    expect(selectAll(all)).not.toBe(all);
    expect(deselectAll()).toEqual([]);
  });

  it("toggles one section and keeps the list order", () => {
    expect(toggleSection(all, ["S3"], "S1")).toEqual(["S1", "S3"]);
    expect(toggleSection(all, ["S1", "S3"], "S1")).toEqual(["S3"]);
    expect(toggleSection(all, ["S1"], "S1")).toEqual([]);
  });

  it("has the hint for an empty selection", () => {
    expect(keepOneHint).toBe("Keep at least one section.");
  });
});
