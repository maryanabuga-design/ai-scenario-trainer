import { Lightbulb } from "lucide-react";
import { GuideChip } from "@/components/GuideChip/GuideChip";
import type { Hint } from "@/lib/items";

/**
 * The hint, inside the page under the options: a small "Hint" label with the lightbulb, the text
 * and the Guide chip of the section it points to. A reminder only, never the answer.
 */
export function HintCard({ hint }: { hint: Hint }) {
  return (
    <section
      aria-label="Hint"
      className="flex flex-col gap-3 rounded-card bg-card p-4 shadow-(--card-shadow)"
    >
      <h2 className="type-label flex items-center gap-1.5 text-text-secondary">
        <Lightbulb size={14} strokeWidth={2} aria-hidden="true" />
        Hint
      </h2>
      <p>{hint.text}</p>
      {hint.section && (
        <div className="flex">
          <GuideChip sectionId={hint.section} />
        </div>
      )}
    </section>
  );
}
