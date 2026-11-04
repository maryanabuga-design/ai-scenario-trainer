import { describe, expect, it } from "vitest";
import { nextSort, sortRows } from "@/components/DataTable/sort";

const rows = [
  { name: "Cleo", score: 70 },
  { name: "Ana", score: 90 },
  { name: "Ben", score: 70 },
];
const value = (row: (typeof rows)[number], id: string) => (id === "name" ? row.name : row.score);

describe("sorting", () => {
  it("a click sorts ascending, the next one descending", () => {
    const first = nextSort(null, "name");
    expect(first).toEqual({ id: "name", direction: "ascending" });
    expect(nextSort(first, "name")).toEqual({ id: "name", direction: "descending" });
    expect(nextSort(first, "score")).toEqual({ id: "score", direction: "ascending" });
  });

  it("keeps the given order without a sort", () => {
    expect(sortRows(rows, null, value)).toBe(rows);
  });

  it("sorts text and numbers, both ways, and keeps equal rows in their order", () => {
    expect(
      sortRows(rows, { id: "name", direction: "ascending" }, value).map((r) => r.name),
    ).toEqual(["Ana", "Ben", "Cleo"]);
    expect(
      sortRows(rows, { id: "score", direction: "descending" }, value).map((r) => r.name),
    ).toEqual(["Ana", "Cleo", "Ben"]);
    expect(
      sortRows(rows, { id: "score", direction: "ascending" }, value).map((r) => r.name),
    ).toEqual(["Cleo", "Ben", "Ana"]);
  });
});
