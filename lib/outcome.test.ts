import { describe, expect, it } from "vitest";
import { formatOutcome, stateLabel } from "@/lib/outcome";
import { getScenario, scenarios } from "@/lib/scenario";

const evacuation = scenarios[0];
const flood = getScenario("flood-preparedness-001");
const metric = (def: typeof evacuation, key: string) =>
  def.outcome.find((candidate) => candidate.key === key)!;

describe("outcome labels", () => {
  it("has a human label for every state value in each scenario", () => {
    expect(evacuation.stateLabels?.smokeLevel).toEqual({ 1: "Light", 2: "Moderate", 3: "Heavy" });
    expect(evacuation.stateLabels?.casualtyStability).toEqual({ "-1": "Worsened", 0: "Stable" });
    expect(flood.stateLabels?.waterLevel).toEqual({ 1: "Low", 2: "Rising", 3: "High" });
  });

  it("takes the nearest label past the ends", () => {
    expect(stateLabel(evacuation, "smokeLevel", 5)).toBe("Heavy");
    expect(stateLabel(evacuation, "casualtyStability", -3)).toBe("Worsened");
  });

  it("formats the Outcome rows", () => {
    expect(metric(evacuation, "timeLostSeconds").label).toBe("Time lost");
    expect(formatOutcome(evacuation, metric(evacuation, "timeLostSeconds"), 90, 0)).toBe(
      "1 min 30 s",
    );
    expect(metric(evacuation, "smokeLevel").label).toBe("Smoke on the route");
    expect(formatOutcome(evacuation, metric(evacuation, "smokeLevel"), 2, 1)).toBe(
      "Moderate (up from Light)",
    );
    expect(formatOutcome(evacuation, metric(evacuation, "smokeLevel"), 1, 1)).toBe(
      "Light (unchanged)",
    );
    expect(metric(evacuation, "casualtyStability").label).toBe("Colleague's condition");
    expect(formatOutcome(evacuation, metric(evacuation, "casualtyStability"), 0, 0)).toBe("Stable");
    expect(formatOutcome(evacuation, metric(evacuation, "casualtyStability"), -1, 0)).toBe(
      "Worsened",
    );
    expect(formatOutcome(flood, metric(flood, "waterLevel"), 2, 1)).toBe("Rising (up from Low)");
  });

  it("shows the colleague only in Full and Extended", () => {
    expect(metric(evacuation, "casualtyStability").lengths).toEqual(["full", "extended"]);
  });
});
