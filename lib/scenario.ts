import scenarioData from "@/content/scenario-building-evacuation.json";
import floodData from "@/content/scenario-flood-preparedness.json";

export type Confidence = 1 | 2 | 3;

/** Changes to the situation, for example timeLostSeconds, smokeLevel, waterLevel. */
export type Effects = Record<string, number>;

export type Option = {
  id: string;
  text: string;
  correct: boolean;
  why: string;
  consequence: string;
  misconception?: string;
  effects?: Effects;
};

export type SuggestedQuestion = {
  question: string;
  closestSources: string[];
  keywords: string[];
};

export type ChatEntry = {
  id: string;
  question: string;
  answer: string;
  sources: string[];
  keywords: string[];
  /** "afterFeedback" answers explain the options, so they stay hidden until the trainee has answered. */
  availability: "always" | "afterFeedback";
  suggested: boolean;
};

export type Step = {
  id: string;
  title: string;
  sources: string[];
  narrative: string;
  question: string;
  options: Option[];
  /** Points a strong explanation covers. Kept as data; the app does not check explanations. */
  explanationKeyBeats: string[];
  suggestedQuestion?: SuggestedQuestion;
  chat: ChatEntry[];
};

export type Scenario = {
  id: string;
  title: string;
  audience: string;
  initialState: Effects;
  /** Human labels for state values, for example smokeLevel 2 is "Moderate". */
  stateLabels?: Record<string, Record<string, string>>;
  confidenceScale: Record<`${Confidence}`, string>;
  steps: Step[];
};

export const scenario = scenarioData as Scenario;

export type Length = "short" | "full" | "extended";
export type SessionMode = Length | "repeat";

/**
 * Short plays the evacuation part of the story (steps 1 to 3), Full the original six steps,
 * Extended the full story with four extra steps in between. Times are estimates.
 */
export const sessionLengths = {
  short: { stepIds: ["s1", "s2", "s3"], minutes: 5 },
  full: { stepIds: ["s1", "s2", "s3", "s4", "s5", "s6"], minutes: 10 },
  extended: { stepIds: ["s1", "s7", "s2", "s3", "s4", "s5", "s9", "s8", "s6", "s10"], minutes: 16 },
} as const;

/** One row of the situation outcome on results. `lengths` limits it to some session lengths. */
export type OutcomeMetric = {
  key: string;
  label: string;
  format: "time" | "level" | "stability";
  lengths?: Length[];
};

export type ScenarioDef = Scenario & {
  lengths: Partial<
    Record<Length, { stepIds: readonly string[]; minutes: number; summary: string }>
  >;
  /** The length shown on Review and used when a material can make a scenario. */
  defaultLength: Length;
  outcome: OutcomeMetric[];
  /** Shown on results after a Short session when the story goes on in longer ones. */
  shortEnding?: { headline: string; continues: string };
};

/**
 * The flood scenario uses its own step ids (s1 to s3). Its ids get a "flood-" prefix so saved
 * answers never mix with the evacuation steps. It has no prepared Ask AI answers.
 */
const floodScenario: Scenario = {
  ...(floodData as unknown as Omit<Scenario, "steps">),
  steps: (floodData.steps as unknown as Omit<Step, "chat">[]).map((step) => ({
    ...step,
    id: `flood-${step.id}`,
    chat: [],
  })),
};

export const scenarios: ScenarioDef[] = [
  {
    ...scenario,
    lengths: {
      short: {
        ...sessionLengths.short,
        summary: "The evacuation: the alarm, a hot door and smoke.",
      },
      full: {
        ...sessionLengths.full,
        summary: "The whole story, through first aid to the handover.",
      },
      extended: {
        ...sessionLengths.extended,
        summary: "The whole story with four more decisions along the way.",
      },
    },
    defaultLength: "full",
    outcome: [
      { key: "timeLostSeconds", label: "Time lost", format: "time" },
      { key: "smokeLevel", label: "Smoke on the route", format: "level" },
      {
        key: "casualtyStability",
        label: "Colleague's condition",
        format: "stability",
        lengths: ["full", "extended"],
      },
    ],
    shortEnding: {
      headline: "You reached the south stairwell.",
      continues:
        "The full session continues to an injured colleague, the call for help and the assembly point.",
    },
  },
  {
    ...floodScenario,
    lengths: {
      short: {
        stepIds: floodScenario.steps.map((step) => step.id),
        minutes: 5,
        summary: "The whole flood story: the warning, the flooded street and the return.",
      },
    },
    defaultLength: "short",
    outcome: [
      { key: "timeLostSeconds", label: "Time lost", format: "time" },
      { key: "waterLevel", label: "Water level", format: "level" },
    ],
  },
];

export const defaultScenarioId = scenario.id;

/** A scenario by id; sessions saved before there were two scenarios belong to the evacuation one. */
export function getScenario(id: string | undefined): ScenarioDef {
  return scenarios.find((candidate) => candidate.id === id) ?? scenarios[0];
}

export function getStep(stepId: string): Step {
  for (const candidate of scenarios) {
    const step = candidate.steps.find((item) => item.id === stepId);
    if (step) return step;
  }
  throw new Error(`Unknown step ${stepId}`);
}

/** The steps of a scenario's default length, as shown on Review. */
export function defaultStory(def: ScenarioDef): Step[] {
  return (def.lengths[def.defaultLength]?.stepIds ?? []).map(getStep);
}

export const audienceLabel = scenario.audience.replace(/^Trainee: /, "");
