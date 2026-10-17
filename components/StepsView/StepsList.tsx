import Link from "next/link";
import { Chevron } from "@/components/Chevron/Chevron";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { stepsCard } from "@/components/StepsView/StepCard";
import { STEPS_SUBTITLE, STEPS_TITLE, checklists, stepCountLabel } from "@/lib/checklists";

/**
 * The Steps list: the page header band (Back, title, subtitle) over a card per topic with a step
 * guide. A card has the title and its number of steps, with no icon.
 */
export function StepsList() {
  return (
    <div className="flex flex-col gap-[var(--gutter,1rem)] pb-[var(--gutter,1rem)]">
      <PageHeaderBand
        title={STEPS_TITLE}
        subtitle={STEPS_SUBTITLE}
        back={{ label: "Back to Home", href: "/" }}
      />
      <ul className="flex flex-col gap-3">
        {checklists.map((checklist) => (
          <li key={checklist.id}>
            <Link
              href={`/checklists/${checklist.id}`}
              className={`${stepsCard} flex min-h-11 items-center gap-3 p-[var(--gutter,1rem)] active:bg-secondary-sand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent`}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="type-body-strong">{checklist.title}</span>
                <span className="type-small text-text-secondary tabular-nums">
                  {stepCountLabel(checklist.steps.length)}
                </span>
              </span>
              <Chevron />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
