import sampleFileData from "@/content/sample-files.json";
import type { Material } from "@/lib/materials";
import { materialFromUpload, simulateUpload } from "@/lib/materials";
import { questionsFor } from "@/lib/quiz";
import { getStep, sessionLengths } from "@/lib/scenario";

export type SampleFile = {
  id: string;
  name: string;
  size: number;
  summary: string;
  sectionIds?: string[];
};

export const sampleFiles = sampleFileData as SampleFile[];

/** The guide sections the prepared scenario's full story relies on. */
export const scenarioSections = [
  ...new Set(sessionLengths.full.stepIds.flatMap((stepId) => getStep(stepId).sources)),
].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));

export type TrainingPlan = {
  /** Guide sections found in the material, in guide order. */
  sections: string[];
  /** A scenario needs every section its story relies on; shorter material gets a quiz only. */
  canScenario: boolean;
  scenarioDecisions: number;
};

export function planTraining(material: Pick<Material, "sectionIds">): TrainingPlan {
  const sections = material.sectionIds ?? [];
  return {
    sections,
    canScenario: scenarioSections.every((section) => sections.includes(section)),
    scenarioDecisions: sessionLengths.full.stepIds.length,
  };
}

export type Training = {
  materialId: string;
  scenario: boolean;
  quiz: boolean;
  sections: string[];
  createdAt: number;
};

export type TrainingChoice = { scenario: boolean; quiz: boolean; sections: string[] };

/**
 * Checks a choice made on Create training. Returns the reason it cannot be generated, or null.
 * The scenario is one prepared story, so the sections only shape the quiz.
 */
export function choiceProblem(plan: TrainingPlan, choice: TrainingChoice): string | null {
  if (choice.sections.length === 0) return "Keep at least one section.";
  if (choice.scenario && !plan.canScenario) return "Not enough material for a scenario.";
  if (!choice.scenario && !choice.quiz) return "Choose a scenario, a quiz or both.";
  if (choice.quiz && questionsFor(choice.sections).length === 0) {
    return "These sections have no quiz questions.";
  }
  return null;
}

export function createTraining(
  materialId: string,
  plan: TrainingPlan,
  choice: TrainingChoice,
  now: number,
): Training {
  const problem = choiceProblem(plan, choice);
  if (problem) throw new Error(problem);
  return {
    materialId,
    scenario: choice.scenario,
    quiz: choice.quiz,
    sections: plan.sections.filter((section) => choice.sections.includes(section)),
    createdAt: now,
  };
}

export type Trainings = Record<string, Training>;

export function withTraining(trainings: Trainings | null, training: Training): Trainings {
  return { ...(trainings ?? {}), [training.materialId]: training };
}

/** The material a simulated upload of a sample file becomes. Only the name and size are used. */
export function materialFromSample(sample: SampleFile, now: Date): Material {
  const file = { name: sample.name, size: sample.size };
  const material = materialFromUpload(file, simulateUpload(file), now);
  return material.status === "ready" ? { ...material, sectionIds: sample.sectionIds } : material;
}
