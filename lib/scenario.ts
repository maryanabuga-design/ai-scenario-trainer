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
  followUp: string;
  explanationKeyBeats: string[];
  /** For each key beat, words and short phrases (with a few synonyms) that count as covering it. */
  keyBeatKeywords: string[][];
  suggestedQuestion?: SuggestedQuestion;
  chat: ChatEntry[];
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

export type SessionMode = "short" | "full" | "extended" | "repeat";

/**
 * Short plays the evacuation part of the story (steps 1 to 3), Full the original six steps,
 * Extended the full story with four extra steps in between. Times are estimates.
 */
export const sessionLengths = {
  short: { stepIds: ["s1", "s2", "s3"], minutes: 5 },
  full: { stepIds: ["s1", "s2", "s3", "s4", "s5", "s6"], minutes: 10 },
  extended: { stepIds: ["s1", "s7", "s2", "s3", "s4", "s5", "s9", "s8", "s6", "s10"], minutes: 16 },
} as const;

export function getStep(stepId: string): Step {
  const step = scenario.steps.find((candidate) => candidate.id === stepId);
  if (!step) throw new Error(`Unknown step ${stepId}`);
  return step;
}

export const audienceLabel = scenario.audience.replace(/^Trainee: /, "");
