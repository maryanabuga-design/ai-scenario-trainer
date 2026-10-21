import Link from "next/link";
import { Chevron } from "@/components/Chevron/Chevron";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { stepsCard } from "@/components/StepsView/StepCard";
import { DEMO_NOTE } from "@/lib/cohort";
import type { TopicStanding } from "@/lib/overview";

/** The address of the Students list filtered to a topic, opened from Topics (Back returns here). */
export const topicStudentsHref = (id: string) => `/instructor/students?topic=${id}&from=topics`;

/**
 * The group Topics screen (DESIGN.md: Instructor, Topics): all ten topics as 80px cards, the weakest
 * first. A card opens Students filtered to that topic; a topic nobody has answered says so and is not
 * tappable (no chevron).
 */
export function TopicsView({
  standings,
  titleOf,
}: {
  standings: TopicStanding[];
  titleOf: (id: string) => string;
}) {
  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title="Topics"
        subtitle="How the group is doing by topic"
        back={{ label: "Back to Overview", href: "/instructor" }}
      />
      <ul className="flex flex-col gap-3">
        {standings.map((topic) => {
          const classes = `${stepsCard} flex h-[var(--list-card-height,80px)] items-center gap-3 px-[var(--gutter,1rem)]`;
          const body = (
            <>
              <span
                aria-hidden="true"
                className="type-caption flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-olive-tint text-text"
              >
                {topic.sectionId}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span data-topic-title className="type-body truncate">
                  <span className="sr-only">{topic.sectionId} </span>
                  {titleOf(topic.sectionId)}
                </span>
                <span className="type-small line-clamp-2 leading-snug text-text-secondary tabular-nums">
                  {topic.total === 0
                    ? "No data yet"
                    : `${topic.passing} of ${topic.total} students at or above the pass mark`}
                </span>
              </span>
              {topic.total > 0 && <Chevron />}
            </>
          );
          return (
            <li key={topic.sectionId} data-topic-card={topic.sectionId}>
              {topic.total > 0 ? (
                <Link
                  href={topicStudentsHref(topic.sectionId)}
                  className={`${classes} has-focus-visible:outline-2`}
                >
                  {body}
                </Link>
              ) : (
                <div className={classes}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      <p data-demo-note className="type-small text-center text-text-secondary">
        {DEMO_NOTE}
      </p>
    </div>
  );
}
