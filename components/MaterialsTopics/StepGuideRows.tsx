import Link from "next/link";
import { Chevron } from "@/components/Chevron/Chevron";
import { TopicTile } from "@/components/TopicTile/TopicTile";
import { checklists, stepGuideLine } from "@/lib/checklists";
import type { Checklist } from "@/lib/checklists";

/**
 * The step guides as rows in the topic-row pattern (DESIGN.md: Steps in Materials): the neutral icon
 * tile, the title, the muted line "6 steps · S1" and a chevron; a row opens the guide. `items` is for tests.
 */
export function StepGuideRows({ items = checklists }: { items?: Checklist[] }) {
  return (
    <ul data-step-guides>
      {items.map((guide, index) => (
        <li
          key={guide.id}
          className={index < items.length - 1 ? "border-b border-selectable-stroke" : ""}
        >
          <Link
            href={`/checklists/${guide.id}`}
            data-step-guide={guide.id}
            aria-label={`${guide.title}, ${stepGuideLine(guide)}`}
            className="flex min-h-11 items-center gap-3 py-4 active:bg-secondary-sand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
          >
            <TopicTile icon={guide.icon} size="tile" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="type-body-strong">{guide.title}</span>
              <span className="type-small text-text-secondary tabular-nums">
                {stepGuideLine(guide)}
              </span>
            </span>
            <Chevron />
          </Link>
        </li>
      ))}
    </ul>
  );
}
