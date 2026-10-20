/**
 * The situation of a scenario step in its white card (DESIGN.md: Scenario layout). One component
 * for the answering screen and the Answer review, so both stay identical.
 */
export function SituationCard({ text }: { text: string }) {
  return (
    <section data-situation-card className="rounded-card bg-card p-4 shadow-(--card-shadow)">
      <p className="type-body">{text}</p>
    </section>
  );
}
