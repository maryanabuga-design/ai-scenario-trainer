import { scenarios } from "@/lib/scenario";
import type { Effects, OutcomeMetric, ScenarioDef } from "@/lib/scenario";

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest} s`;
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
}

/**
 * The human label for a state value from the scenario JSON ("Moderate" for smoke level 2).
 * Values past the ends take the nearest label, so smoke 5 is still "Heavy".
 */
export function stateLabel(def: ScenarioDef, key: string, value: number): string {
  const labels = def.stateLabels?.[key];
  if (!labels) return String(value);
  const known = Object.keys(labels)
    .map(Number)
    .sort((a, b) => a - b);
  const nearest = known.reduce((best, candidate) =>
    Math.abs(candidate - value) < Math.abs(best - value) ? candidate : best,
  );
  return labels[String(nearest)];
}

/** A metric's value at the end of a session, for the Outcome card. */
export function formatOutcome(
  def: ScenarioDef,
  metric: OutcomeMetric,
  value: number,
  start: number,
): string {
  if (metric.format === "time") return formatTime(value);
  const now = stateLabel(def, metric.key, value);
  if (metric.format === "stability") return now;
  const before = stateLabel(def, metric.key, start);
  if (now === before) return `${now} (unchanged)`;
  return `${now} (${value > start ? "up" : "down"} from ${before})`;
}

/** The scenario a step belongs to. */
export function scenarioOfStep(stepId: string): ScenarioDef {
  return scenarios.find((def) => def.steps.some((step) => step.id === stepId)) ?? scenarios[0];
}

/** One option's change to the situation, for example ["Time lost +30 s", "Smoke on the route +1"]. */
export function describeEffects(stepId: string, effects: Effects): string[] {
  return scenarioOfStep(stepId).outcome.flatMap((metric) => {
    const value = effects[metric.key] ?? 0;
    if (value === 0) return [];
    if (metric.format === "time") {
      return [`${metric.label} ${value > 0 ? "+" : "−"}${formatTime(Math.abs(value))}`];
    }
    if (metric.format === "stability") {
      return [`${metric.label} ${value < 0 ? "worsened" : "improved"}`];
    }
    return [`${metric.label} ${value > 0 ? "+" : "−"}${Math.abs(value)}`];
  });
}
