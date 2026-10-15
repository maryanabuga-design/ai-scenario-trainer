import { questions } from "@/lib/quiz";
import { scenario } from "@/lib/scenario";
import type { Item } from "@/lib/items";
import { sectionOrder } from "@/lib/items";

/** The number of questions in a part. */
export const PART_SIZE = 5;

export type TrainingMode = "scenario" | "quiz";

export type Part = {
  /** `<mode>:<sectionId>:<n>`, n from 1. */
  id: string;
  mode: TrainingMode;
  sectionId: string;
  /** 1-based number of the part within its section. */
  n: number;
  itemIds: string[];
};

/** The guide the Training screen covers: sections S1 to S10 of the evacuation guide. */
export const trainingSections = Array.from({ length: 10 }, (_, index) => `S${index + 1}`);

/** The questions of a mode in the guide's sections: scenario steps in story order, quiz in bank order. */
export function modeItems(mode: TrainingMode): Item[] {
  const all = mode === "scenario" ? scenario.steps : questions;
  return all.filter((item) => trainingSections.includes(item.section));
}

/** Splits ids into chunks of `size` (PART_SIZE); a short list is one chunk, an empty list none. */
export function chunkIds(ids: string[], size: number = PART_SIZE): string[][] {
  const chunks: string[][] = [];
  for (let start = 0; start < ids.length; start += size)
    chunks.push(ids.slice(start, start + size));
  return chunks;
}

/**
 * The parts of a mode, derived and never stored: each section's questions split into chunks of
 * PART_SIZE, in guide order. A section with fewer than PART_SIZE questions has one part; a section
 * without questions in the mode has none.
 */
export function partsFor(mode: TrainingMode): Part[] {
  const items = modeItems(mode);
  return [...trainingSections]
    .sort((a, b) => sectionOrder(a) - sectionOrder(b))
    .flatMap((sectionId) => {
      const ids = items.filter((item) => item.section === sectionId).map((item) => item.id);
      return chunkIds(ids).map((chunk, index) => ({
        id: `${mode}:${sectionId}:${index + 1}`,
        mode,
        sectionId,
        n: index + 1,
        itemIds: chunk,
      }));
    });
}

export function getPart(id: string): Part | undefined {
  const mode = id.split(":")[0];
  if (mode !== "scenario" && mode !== "quiz") return undefined;
  return partsFor(mode).find((part) => part.id === id);
}

/** The sections that have questions in a mode, in guide order. */
export function sectionsWithParts(mode: TrainingMode): string[] {
  return [...new Set(partsFor(mode).map((part) => part.sectionId))];
}
