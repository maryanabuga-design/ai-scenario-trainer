import Link from "next/link";
import { Chevron } from "@/components/Chevron/Chevron";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { stepsCard } from "@/components/StepsView/StepCard";
import { TopicTile } from "@/components/TopicTile/TopicTile";
import { STEPS_SUBTITLE, STEPS_TITLE, checklists, stepCountLabel } from "@/lib/checklists";
import { topicIcon } from "@/lib/weak-topics";

/** The Steps list: a card per topic with a step guide, with its number of steps. */
export function StepsList() {
  return (
    <div className="flex flex-col gap-6 pb-6">
      <CircleBackButton size="small" href="/" label="Back to Home" />
      <header className="flex flex-col gap-1">
        <h1 className="type-page-title">{STEPS_TITLE}</h1>
        <p className="type-body text-text-secondary">{STEPS_SUBTITLE}</p>
      </header>
      <ul className="flex flex-col gap-3">
        {checklists.map((checklist) => (
          <li key={checklist.id}>
            <Link
              href={`/checklists/${checklist.id}`}
              className={`${stepsCard} flex min-h-11 items-center gap-3 p-[var(--gutter,1rem)] active:bg-secondary-sand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent`}
            >
              <TopicTile
                sectionId={checklist.topic}
                icon={topicIcon(checklist.topic)}
                size="circle44"
                tone="olive"
              />
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
