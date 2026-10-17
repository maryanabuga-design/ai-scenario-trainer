import Link from "next/link";
import { Chevron } from "@/components/Chevron/Chevron";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { stepsCard } from "@/components/StepsView/StepCard";
import { TopicTile } from "@/components/TopicTile/TopicTile";
import { STEPS_SUBTITLE, STEPS_TITLE, checklists, stepCountLabel } from "@/lib/checklists";
import type { Checklist } from "@/lib/checklists";

/**
 * The Steps list: the page header band (Back, title, subtitle) over a card per topic with a step
 * guide. Every card has the same fixed height; the title and the step count are one line each and
 * end with an ellipsis when too long, so the chevron is never pushed out. `items` is for tests.
 */
export function StepsList({ items = checklists }: { items?: Checklist[] }) {
  return (
    <div className="flex flex-col gap-[var(--gutter,1rem)] pb-[var(--gutter,1rem)]">
      <PageHeaderBand
        title={STEPS_TITLE}
        subtitle={STEPS_SUBTITLE}
        back={{ label: "Back to Home", href: "/" }}
      />
      <ul className="flex flex-col gap-3">
        {items.map((checklist) => (
          <li key={checklist.id}>
            <Link
              href={`/checklists/${checklist.id}`}
              aria-label={`${checklist.title}, ${stepCountLabel(checklist.steps.length)}`}
              className={`${stepsCard} flex h-[var(--list-card-height,80px)] items-center gap-3 px-[var(--gutter,1rem)] active:bg-secondary-sand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent`}
            >
              <TopicTile
                sectionId={checklist.topic}
                icon={checklist.icon}
                size="tile"
                tone="icon"
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="type-body-strong truncate">{checklist.title}</span>
                <span className="type-small truncate text-text-secondary tabular-nums">
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
