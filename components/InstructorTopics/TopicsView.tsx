import { TopicCodeBadge } from "@/components/TopicCodeBadge/TopicCodeBadge";
import { AssignIcon } from "@/components/AssignIcon/AssignIcon";
import Link from "next/link";
import { ButtonLink } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { stepsCard } from "@/components/StepsView/StepCard";
import { needsReviewTag } from "@/lib/overview";
import { assignOnTopicParams } from "@/lib/students";
import type { TopicStanding } from "@/lib/overview";

/** The address of the students below the pass mark in a topic (Back returns to the Topics view). */
export const topicStudentsHref = (id: string) => `/instructor/students/topic/${id}`;

/** The address of Assign exam with a topic chosen (the title is prefilled from it). */
export const assignOnTopic = (id: string) => `/instructor/exams/new?${assignOnTopicParams(id)}`;

export const NEEDS_REVIEW = "Needs review";

/** The amber "Needs review" tag (text plus the amber tone, never red). */
export function ReviewTag() {
  return (
    <span
      data-review-tag
      className="type-caption shrink-0 rounded-full bg-status-attention-bg px-2 py-0.5 whitespace-nowrap text-status-attention-ink"
    >
      {NEEDS_REVIEW}
    </span>
  );
}

/** The S-code badge of a topic. */
export const TopicBadge = ({ id }: { id: string }) => <TopicCodeBadge id={id} />;

/**
 * The Topics view of the Students tab (DESIGN.md: Instructor, Students rebuilt): ten 80px cards
 * from the weakest topic, each with the S badge, the name, the amber "Needs review" tag when fewer
 * than half of the active students are on track, the one-line count and a chevron to the students
 * below the pass mark; then the Secondary "Assign exam on weakest topic".
 */
export function TopicsView({
  standings,
  titleOf,
}: {
  standings: TopicStanding[];
  titleOf: (id: string) => string;
}) {
  const weakest = standings.find((topic) => topic.total > 0) ?? standings[0];
  return (
    <>
      <ul className="flex flex-col gap-3 idesk:grid idesk:grid-cols-2 idesk:gap-6 idesk:@[1100px]:grid-cols-3">
        {standings.map((topic) => {
          const classes = `${stepsCard} flex h-[var(--list-card-height,80px)] items-center gap-3 px-[var(--gutter,1rem)]`;
          const body = (
            <>
              <TopicBadge id={topic.sectionId} />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span data-topic-title className="type-body-strong w-full truncate leading-snug">
                    <span className="sr-only">{topic.sectionId} </span>
                    {titleOf(topic.sectionId)}
                  </span>
                  {needsReviewTag(topic) && <ReviewTag />}
                </span>
                <span className="type-small whitespace-nowrap text-text-secondary tabular-nums">
                  {topic.total === 0
                    ? "No data yet"
                    : `${topic.passing} of ${topic.total} at or above pass mark`}
                </span>
              </span>
            </>
          );
          return (
            <li key={topic.sectionId} data-topic-card={topic.sectionId}>
              {topic.total === 0 ? (
                <div className={classes}>{body}</div>
              ) : (
                <Link
                  href={topicStudentsHref(topic.sectionId)}
                  className={`${classes} has-focus-visible:outline-2`}
                >
                  {body}
                  <Chevron />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      {weakest && weakest.total > 0 && (
        <div className="contents idesk:flex idesk:[&>a]:w-auto!">
          <ButtonLink href={assignOnTopic(weakest.sectionId)} variant="secondary" icon={AssignIcon}>
            Assign exam on weakest topic
          </ButtonLink>
        </div>
      )}
    </>
  );
}
