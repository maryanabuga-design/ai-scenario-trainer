export type SortDirection = "ascending" | "descending";
export type SortState = { id: string; direction: SortDirection } | null;

/** The next sort after a click on a column header: first ascending, then descending. */
export function nextSort(current: SortState, id: string): SortState {
  if (current?.id === id) {
    return { id, direction: current.direction === "ascending" ? "descending" : "ascending" };
  }
  return { id, direction: "ascending" };
}

/** A sorted copy; the rows keep their order when no sort is chosen or two values are equal. */
export function sortRows<T>(
  rows: T[],
  sort: SortState,
  value: (row: T, id: string) => string | number,
): T[] {
  if (!sort) return rows;
  const sign = sort.direction === "ascending" ? 1 : -1;
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const x = value(a.row, sort.id);
      const y = value(b.row, sort.id);
      const order =
        typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return sign * order || a.index - b.index;
    })
    .map(({ row }) => row);
}
