import data from "@/content/checklists.json";

export type Checklist = {
  id: string;
  title: string;
  /** The guide sections the steps come from. */
  guideRef: string[];
  steps: string[];
};

/** The quick checklists, written from the guide's own sentences. */
export const checklists: Checklist[] = data.checklists;

export function getChecklist(id: string): Checklist | undefined {
  return checklists.find((checklist) => checklist.id === id);
}

/** "6 steps", or "1 step". */
export function stepCountLabel(count: number): string {
  return `${count} ${count === 1 ? "step" : "steps"}`;
}
