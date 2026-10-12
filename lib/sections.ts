/** Shown, and the primary button disabled, while no section is selected. */
export const keepOneHint = "Keep at least one section.";

/** Which of the two text buttons can be used: Select all and Deselect all. */
export function selectionState(all: string[], selected: string[]) {
  return {
    canSelectAll: all.some((id) => !selected.includes(id)),
    canDeselectAll: selected.length > 0,
  };
}

export function selectAll(all: string[]): string[] {
  return [...all];
}

export function deselectAll(): string[] {
  return [];
}

/** Ticks or unticks one section, keeping the order of the list. */
export function toggleSection(all: string[], selected: string[], id: string): string[] {
  const next = selected.includes(id)
    ? selected.filter((section) => section !== id)
    : [...selected, id];
  return all.filter((section) => next.includes(section));
}
