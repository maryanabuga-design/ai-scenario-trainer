import type { Item } from "@/lib/items";
import { inGuideOrder } from "@/lib/items";
import { questionsFor } from "@/lib/quiz";
import { getScenario } from "@/lib/scenario";
import type { SessionKind } from "@/lib/session";

export type SetupMode = "scenario" | "quiz";

/** The session lengths offered, in questions; the same for Scenario and Quiz. */
export const LENGTHS = [10, 20, 30] as const;

export type LengthOption = { value: number; label: string };

/** The questions or situations the chosen sections hold for this mode. */
export function poolFor(
  mode: SetupMode,
  scenarioId: string | undefined,
  sections: string[],
): Item[] {
  return mode === "quiz"
    ? questionsFor(sections)
    : getScenario(scenarioId).steps.filter((step) => sections.includes(step.section));
}

/**
 * The lengths on offer: 10, 20 and 30, limited to what is available (fewer than 30 hides 30,
 * fewer than 20 hides 20). With fewer than 10 available there is one option, "All N".
 */
export function lengthOptions(available: number): LengthOption[] {
  if (available <= 0) return [];
  if (available < LENGTHS[0]) return [{ value: available, label: `All ${available}` }];
  return LENGTHS.filter((length) => length <= available).map((length) => ({
    value: length,
    label: `${length} questions`,
  }));
}

/** Keeps the chosen length if it is offered; otherwise the largest offered one below it, or the first. */
export function fitLength(chosen: number, available: number): number {
  const options = lengthOptions(available);
  if (options.length === 0) return chosen;
  if (options.some((option) => option.value === chosen)) return chosen;
  const below = options.filter((option) => option.value < chosen);
  return (below.at(-1) ?? options[0]).value;
}

/**
 * A scenario takes the first k situations of each section in story order: 10 gives 1 per section,
 * 20 gives 2, 30 gives 3 (with fewer situations than that it goes round the sections until the
 * length is filled). The chosen situations stay in story order.
 */
export function pickScenarioItems(steps: Item[], sections: string[], length: number): string[] {
  const bySection = inGuideOrder(sections).map((section) =>
    steps.filter((step) => step.section === section),
  );
  const picked = new Set<string>();
  for (
    let round = 0;
    picked.size < length && bySection.some((list) => list.length > round);
    round++
  ) {
    for (const list of bySection) {
      if (list[round] && picked.size < length) picked.add(list[round].id);
    }
  }
  return steps.filter((step) => picked.has(step.id)).map((step) => step.id);
}

/** A quiz draws at random: shuffled within each section, then taken in turns from each section. */
export function pickQuizItems(
  sections: string[],
  length: number,
  random: () => number = Math.random,
): string[] {
  const shuffle = <T>(list: T[]) =>
    list
      .map((item) => ({ item, key: random() }))
      .sort((a, b) => a.key - b.key)
      .map(({ item }) => item);
  const bySection = inGuideOrder(sections).map((section) => shuffle(questionsFor([section])));
  const picked: Item[] = [];
  for (
    let round = 0;
    picked.length < length && bySection.some((list) => list.length > round);
    round++
  ) {
    for (const list of bySection) {
      if (list[round] && picked.length < length) picked.push(list[round]);
    }
  }
  return picked.map((question) => question.id);
}

export type SetupChoice = {
  mode: SetupMode;
  scenarioId?: string;
  sections: string[];
  length: number;
  /** Quiz only: a random order instead of the guide's order. */
  shuffle: boolean;
};

/** The session to start from the setup choices. */
export function buildSession(
  choice: SetupChoice,
  random: () => number = Math.random,
): { kind: SessionKind; itemIds: string[]; scenarioId?: string } {
  if (choice.mode === "scenario") {
    const scenarioId = getScenario(choice.scenarioId).id;
    return {
      kind: "scenario",
      scenarioId,
      itemIds: pickScenarioItems(getScenario(scenarioId).steps, choice.sections, choice.length),
    };
  }
  const ids = pickQuizItems(choice.sections, choice.length, random);
  if (choice.shuffle) {
    return {
      kind: "quiz",
      itemIds: ids
        .map((id) => ({ id, key: random() }))
        .sort((a, b) => a.key - b.key)
        .map(({ id }) => id),
    };
  }
  const order = questionsFor(choice.sections).map((question) => question.id);
  return { kind: "quiz", itemIds: [...ids].sort((a, b) => order.indexOf(a) - order.indexOf(b)) };
}

/** "Only topics to repeat" limits the chosen sections to the ones with a wrong answer. */
export function onlyWeakSections(sections: string[], weakSectionIds: string[]): string[] {
  return sections.filter((section) => weakSectionIds.includes(section));
}

/** "N questions", or "1 question". */
export function questionCountLabel(count: number): string {
  return `${count} ${count === 1 ? "question" : "questions"}`;
}
