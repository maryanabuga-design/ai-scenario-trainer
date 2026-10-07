import scenarioData from "@/content/scenario-building-evacuation.json";

export type Confidence = 1 | 2 | 3;

export type Effects = {
  timeLostSeconds?: number;
  smokeLevel?: number;
  casualtyStability?: number;
};

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
};

export type Step = {
  id: string;
  title: string;
  sources: string[];
  narrative: string;
  question: string;
  options: Option[];
  followUp: string;
  explanationKeyBeats: string[];
  suggestedQuestion?: SuggestedQuestion;
};

export type Scenario = {
  id: string;
  title: string;
  audience: string;
  initialState: Required<Effects>;
  confidenceScale: Record<`${Confidence}`, string>;
  steps: Step[];
};

export const scenario = scenarioData as Scenario;

export type SessionMode = "short" | "full" | "repeat";

/** Short plays the evacuation part of the story (steps 1 to 3). Times are estimates. */
export const sessionLengths = {
  short: { stepIds: ["s1", "s2", "s3"], minutes: 5 },
  full: { stepIds: scenario.steps.map((step) => step.id), minutes: 10 },
} as const;

export function getStep(stepId: string): Step {
  const step = scenario.steps.find((candidate) => candidate.id === stepId);
  if (!step) throw new Error(`Unknown step ${stepId}`);
  return step;
}

export const audienceLabel = scenario.audience.replace(/^Trainee: /, "");
