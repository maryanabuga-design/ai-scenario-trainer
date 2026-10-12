import { scenarios } from "@/lib/scenario";
import type { Effects, OutcomeMetric, ScenarioDef } from "@/lib/scenario";

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest} s`;
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
}

/** A metric's value at the end of a session, for the results rows. */
export function formatMetric(metric: OutcomeMetric, value: number, start: number) {
  if (metric.format === "time") return formatTime(value);
  if (metric.format === "stability") return value < 0 ? `Worse (${value})` : "Stable";
  return `${value} (started at ${start})`;
}

/** The scenario a step belongs to. */
export function scenarioOfStep(stepId: string): ScenarioDef {
  return scenarios.find((def) => def.steps.some((step) => step.id === stepId)) ?? scenarios[0];
}

/** One option's change to the situation, for example ["Time lost +30 s", "Smoke level +1"]. */
export function describeEffects(stepId: string, effects: Effects): string[] {
  return scenarioOfStep(stepId).outcome.flatMap((metric) => {
    const value = effects[metric.key] ?? 0;
    if (value === 0) return [];
    if (metric.format === "time") {
      return [`${metric.label} ${value > 0 ? "+" : "−"}${formatTime(Math.abs(value))}`];
    }
    if (metric.format === "stability") {
      return [`${metric.label} ${value < 0 ? "worse" : "better"}`];
    }
    return [`${metric.label} ${value > 0 ? "+" : "−"}${Math.abs(value)}`];
  });
}
