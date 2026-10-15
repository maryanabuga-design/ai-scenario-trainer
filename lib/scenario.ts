import scenarioData from "@/content/scenario-building-evacuation.json";
import floodData from "@/content/scenario-flood-preparedness.json";
import type { Item } from "@/lib/items";

type ScenarioFile = {
  id: string;
  title: string;
  audience: string;
  steps: Omit<Item, "kind">[];
};

export type ScenarioDef = {
  id: string;
  title: string;
  audience: string;
  /** The situations in story order. */
  steps: Item[];
};

function fromFile(file: ScenarioFile): ScenarioDef {
  return {
    id: file.id,
    title: file.title,
    audience: file.audience,
    steps: file.steps.map((step) => ({ ...step, kind: "step" as const })),
  };
}

/** The flood scenario's step ids carry a "flood-" prefix in its file, and it has no prepared Ask AI answers. */
export const scenarios: ScenarioDef[] = [
  fromFile(scenarioData as ScenarioFile),
  fromFile(floodData as ScenarioFile),
];

export const scenario = scenarios[0];
export const defaultScenarioId = scenario.id;

/** A scenario by id; sessions saved before there were two scenarios belong to the evacuation one. */
export function getScenario(id: string | undefined): ScenarioDef {
  return scenarios.find((candidate) => candidate.id === id) ?? scenarios[0];
}

export function getStep(stepId: string): Item {
  for (const candidate of scenarios) {
    const step = candidate.steps.find((item) => item.id === stepId);
    if (step) return step;
  }
  throw new Error(`Unknown step ${stepId}`);
}

export const audienceLabel = scenario.audience.replace(/^Trainee: /, "");
