import { ChevronDown } from "lucide-react";
import type { Step } from "@/lib/checklists";

/** The fill, border and radius of the Steps list card and the Source row. */
export const stepsCard = "rounded-card border border-selectable-stroke bg-list-card";

/**
 * One step as an accordion card in the standard card style (only its caption is green,
 * `--step-caption`): the caption, the title and a chevron in one header button (`aria-expanded`, `aria-controls`), and the details in a region that animates its height (a grid
 * row from 0fr to 1fr) and, closed, is inert and invisible. The padding is the page gutter on every
 * side. There is no done state.
 */
export function StepCard({
  step,
  index,
  open,
  onToggleOpen,
}: {
  step: Step;
  index: number;
  open: boolean;
  onToggleOpen: () => void;
}) {
  const headerId = `${step.id}-header`;
  const panelId = `${step.id}-panel`;
  return (
    <li className="overflow-hidden rounded-card border border-selectable-stroke bg-card">
      <button
        type="button"
        id={headerId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggleOpen}
        className="flex min-h-11 w-full items-center gap-3 p-[var(--gutter,1rem)] text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="type-label text-step-caption">Step {index + 1}</span>
          <span className="type-body-strong text-text">{step.title}</span>
        </span>
        <ChevronDown
          size={20}
          strokeWidth={2}
          aria-hidden="true"
          className={`shrink-0 text-text transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        aria-hidden={!open}
        inert={!open}
        className={`grid transition-[grid-template-rows,visibility] duration-200 motion-reduce:transition-none ${open ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]"}`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-2 px-[var(--gutter,1rem)] pb-[var(--gutter,1rem)]">
            {step.details.map((detail) => (
              <p key={detail} className="type-body text-text">
                {detail}
              </p>
            ))}
          </div>
        </div>
      </div>
    </li>
  );
}
