import scenarioData from "@/content/scenario-building-evacuation.json";

export type ScenarioSummary = {
  title: string;
  audience: string;
  decisionCount: number;
};

export function loadScenarioSummary(): ScenarioSummary {
  return {
    title: scenarioData.title,
    audience: scenarioData.audience.replace(/^Trainee: /, ""),
    decisionCount: scenarioData.steps.length,
  };
}
