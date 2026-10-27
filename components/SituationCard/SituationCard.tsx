import type { ReactNode } from "react";

/** The situation of a scenario step, on its own white card. `corner` is a control inside its top-right corner. */
export function SituationCard({ text, corner }: { text: string; corner?: ReactNode }) {
  return (
    <section
      data-situation-card
      className={`relative rounded-card bg-card p-4 shadow-(--card-shadow) ${corner ? "pr-[52px]" : ""}`}
    >
      <p className="type-body">{text}</p>
      {corner}
    </section>
  );
}
