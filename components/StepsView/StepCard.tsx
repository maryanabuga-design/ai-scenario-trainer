import { Check, ChevronDown } from "lucide-react";
import type { Step } from "@/lib/checklists";

/** The fill, border and radius shared by the Steps list card, summary card and step card. */
export const stepsCard = "rounded-card border border-selectable-stroke bg-list-card";

/**
 * One step as an accordion card. The header is a button (`aria-expanded`, `aria-controls`) and the
 * done-circle beside it is a second button, so ticking a step never opens or closes it. The details
 * live in a region that animates its height (a grid row from 0fr to 1fr) and, closed, is inert.
 */
export function StepCard({
  step,
  index,
  open,
  done,
  onToggleOpen,
  onToggleDone,
}: {
  step: Step;
  index: number;
  open: boolean;
  done: boolean;
  onToggleOpen: () => void;
  onToggleDone: () => void;
}) {
  const headerId = `${step.id}-header`;
  const panelId = `${step.id}-panel`;
  const focus =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
  return (
    <li className={`${stepsCard} overflow-hidden`}>
      <div className="flex items-center gap-1 p-[var(--gutter,1rem)]">
        <button
          type="button"
          aria-pressed={done}
          aria-label={done ? `Step ${index + 1} done` : `Mark step ${index + 1} done`}
          onClick={onToggleDone}
          className={`-ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${focus}`}
        >
          <span
            aria-hidden="true"
            className={`flex h-6 w-6 items-center justify-center rounded-full ${
              done
                ? "bg-primary text-primary-text"
                : "border-[1.5px] border-border-strong bg-list-card"
            }`}
          >
            {done && <Check size={16} strokeWidth={3} />}
          </span>
        </button>
        <button
          type="button"
          id={headerId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggleOpen}
          className={`flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-[12px] pl-2 text-left ${focus}`}
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="type-label text-primary">Step {index + 1}</span>
            <span className="type-body-strong">{step.title}</span>
          </span>
          <ChevronDown
            size={20}
            strokeWidth={2}
            aria-hidden="true"
            className={`shrink-0 text-primary transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>
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
              <p key={detail} className="type-body">
                {detail}
              </p>
            ))}
          </div>
        </div>
      </div>
    </li>
  );
}
