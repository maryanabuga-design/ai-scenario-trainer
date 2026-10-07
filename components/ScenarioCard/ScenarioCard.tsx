import type { ScenarioSummary } from "@/lib/scenario";

export function ScenarioCard({ scenario }: { scenario: ScenarioSummary }) {
  return (
    <section
      aria-labelledby="scenario-title"
      className="rounded-card border border-border bg-surface p-4"
    >
      <p className="text-xs text-text-secondary">Scenario</p>
      <h2 id="scenario-title" className="mt-1 font-serif text-xl">
        {scenario.title}
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        <span className="tabular-nums">{scenario.decisionCount}</span> decisions
      </p>
      <p className="mt-2 text-sm text-text-secondary">For a {scenario.audience}.</p>
    </section>
  );
}
