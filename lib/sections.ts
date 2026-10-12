/** Shown, and the primary button disabled, while no section is selected. */
export const keepOneHint = "Keep at least one section.";

/**
 * The one text toggle next to the section title: "Deselect all" when every section is selected
 * (it clears them), "Select all" in any other state (it selects them all).
 */
export function selectionToggle(all: string[], selected: string[]) {
  const everything = all.length > 0 && all.every((id) => selected.includes(id));
  return everything
    ? { label: "Deselect all" as const, next: [] as string[] }
    : { label: "Select all" as const, next: [...all] };
}

/** Every section starts selected: a training's sections, or else every section in the list. */
export function defaultSections(all: string[], trainingSections?: string[]): string[] {
  return trainingSections ? all.filter((id) => trainingSections.includes(id)) : [...all];
}

/** The reason the primary button is disabled, or null when at least one section is selected. */
export function sectionsProblem(selected: string[]): string | null {
  return selected.length === 0 ? keepOneHint : null;
}

/** Ticks or unticks one section, keeping the order of the list. */
export function toggleSection(all: string[], selected: string[], id: string): string[] {
  const next = selected.includes(id)
    ? selected.filter((section) => section !== id)
    : [...selected, id];
  return all.filter((section) => next.includes(section));
}
