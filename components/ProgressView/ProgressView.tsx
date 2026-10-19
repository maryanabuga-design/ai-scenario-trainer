"use client";

import { ChevronDown, History } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { Chip } from "@/components/Chip/Chip";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { HeaderRow } from "@/components/HeaderRow/HeaderRow";
import { ReadinessBar } from "@/components/ReadinessBar/ReadinessBar";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { stepsCard } from "@/components/StepsView/StepCard";
import type { AssignedExam } from "@/lib/assigned-exams";
import { HISTORY_PAGE, seeMore, visibleHistory } from "@/lib/history";
import {
  activityLabel,
  allTopicIds,
  activitySummary,
  readinessCard,
  recentSessions,
  sessionDate,
  sessionModeLabel,
  sessionResult,
  sessionTopicIds,
  topicGroups,
} from "@/lib/progress-view";
import type { TopicProgress, TopicStatus } from "@/lib/progress-view";
import { hasWeakTopics } from "@/lib/readiness";
import type { FinishedSession } from "@/lib/session";
import { examPath } from "@/lib/weak-session";

/** How many sessions the Recent sessions list shows before "See all". */
export const RECENT_SESSIONS = 3;

export const sessionsPath = "/progress/sessions";

const status: Record<TopicStatus, { label: string; tone: "neutral" | "attention" | "success" }> = {
  "not-started": { label: "Not started", tone: "neutral" },
  "needs-work": { label: "Needs work", tone: "attention" },
  ready: { label: "Ready", tone: "success" },
};

const rowClass = `${stepsCard} flex min-h-14 w-full items-center gap-3 p-[var(--gutter,1rem)] text-left`;
const focusClass =
  "active:bg-secondary-sand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * The readiness card: the ONE measured percentage of the screen ("Readiness"), the shared bar with
 * its pass-mark marker, one plain sentence and one button (Repeat weak topics, or Start exam once
 * ready). No red anywhere.
 */
function ReadinessSection({
  exam,
  history,
  now,
  onRepeat,
}: {
  exam: AssignedExam | null;
  history: FinishedSession[];
  now: Date;
  onRepeat: () => void;
}) {
  const topics = exam?.topicIds ?? null;
  const card = readinessCard(topics, history, now, exam);
  return (
    <section
      aria-labelledby="exam-readiness"
      className="flex flex-col gap-4 rounded-card bg-card p-4 shadow-(--card-shadow)"
    >
      <div className="flex flex-col gap-0.5">
        <h2 id="exam-readiness" className="type-item-title">
          {card.title}
        </h2>
        {card.subtitle && <p className="type-small text-text-secondary">{card.subtitle}</p>}
      </div>
      <p className="type-numeral tabular-nums" data-readiness-number>
        Readiness {card.readiness}%
      </p>
      <ReadinessBar percent={card.readiness} />
      <p className="type-body">{card.sentence}</p>
      {card.ready ? (
        <ButtonLink variant="secondary" href={exam ? examPath(exam.id) : "/exam"}>
          Start exam
        </ButtonLink>
      ) : (
        hasWeakTopics(topics ?? allTopicIds, history) && (
          <Button onClick={onRepeat}>Repeat weak topics</Button>
        )
      )}
    </section>
  );
}

/** One topic: one tap target that practises it. Counts and a word, never a percentage. */
function TopicRow({
  row,
  title,
  onPractise,
}: {
  row: TopicProgress;
  title: string;
  onPractise: (topicId: string) => void;
}) {
  const { label, tone } = status[row.status];
  const share = row.total === 0 ? 0 : (row.correct / row.total) * 100;
  return (
    <button
      type="button"
      data-topic-row={row.sectionId}
      onClick={() => onPractise(row.sectionId)}
      className={`${rowClass} ${focusClass}`}
    >
      <span
        aria-hidden="true"
        className="type-caption flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-olive-tint text-text"
      >
        {row.sectionId}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="type-body">
          <span className="sr-only">{row.sectionId} </span>
          {title}
        </span>
        <span className="type-small text-text-secondary tabular-nums">
          {row.correct} of {row.total} correct
        </span>
        <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-secondary-sand">
          <span className="block h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
        </span>
      </span>
      <Chip tone={tone} size="caption">
        {label}
      </Chip>
    </button>
  );
}

function TopicList({
  rows,
  titleOf,
  onPractise,
}: {
  rows: TopicProgress[];
  titleOf: (id: string) => string;
  onPractise: (topicId: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.sectionId}>
          <TopicRow row={row} title={titleOf(row.sectionId)} onPractise={onPractise} />
        </li>
      ))}
    </ul>
  );
}

/**
 * "By topic": ONE list with the exam's topics first ("In your exam") and the others in a disclosure
 * that is closed until it is opened. Without an exam every topic is under "Topics".
 */
function TopicsSection({
  exam,
  history,
  titleOf,
  onPractise,
}: {
  exam: AssignedExam | null;
  history: FinishedSession[];
  titleOf: (id: string) => string;
  onPractise: (topicId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { inExam, other } = topicGroups(exam?.topicIds ?? null, history);
  return (
    <section aria-labelledby="by-topic" className="flex flex-col gap-4">
      <h2 id="by-topic" className="type-item-title">
        By topic
      </h2>
      {inExam.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="type-label text-text-secondary">In your exam</h3>
          <TopicList rows={inExam} titleOf={titleOf} onPractise={onPractise} />
        </div>
      )}
      <div className="flex flex-col gap-3">
        {inExam.length === 0 ? (
          <h3 className="type-label text-text-secondary">Topics</h3>
        ) : (
          <button
            type="button"
            aria-expanded={open}
            aria-controls="other-topics"
            onClick={() => setOpen(!open)}
            className={`${rowClass} ${focusClass} justify-between`}
          >
            <span className="type-body-strong">Other topics ({other.length})</span>
            <ChevronDown
              size={20}
              strokeWidth={2}
              aria-hidden="true"
              className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        )}
        {(inExam.length === 0 || open) && (
          <div id="other-topics">
            <TopicList rows={other} titleOf={titleOf} onPractise={onPractise} />
          </div>
        )}
      </div>
    </section>
  );
}

/** One finished session: mode, topic, "7 of 10 correct" and the date. A row with a screen to open has a chevron. */
export function SessionRow({
  session,
  now,
  titleOf,
  href,
}: {
  session: FinishedSession;
  now: Date;
  titleOf: (id: string) => string;
  href?: string | null;
}) {
  const topics = sessionTopicIds(session);
  const topicName =
    topics.length === 0
      ? null
      : topics.length === 1
        ? titleOf(topics[0])
        : `${topics.length} topics`;
  const { correct, total } = sessionResult(session);
  const content = (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="type-body-strong">
          {sessionModeLabel(session)}
          {topicName && <span className="type-body text-text-secondary"> · {topicName}</span>}
        </span>
        <span className="type-small text-text-secondary tabular-nums">
          {correct} of {total} correct
        </span>
      </span>
      <span className="type-caption shrink-0 self-start text-text-secondary tabular-nums">
        {sessionDate(session.finishedAt, now)}
      </span>
      {href && <Chevron />}
    </>
  );
  return href ? (
    <Link href={href} className={`${rowClass} ${focusClass}`}>
      {content}
    </Link>
  ) : (
    <div
      data-session-row
      className={`${stepsCard} flex min-h-14 items-center gap-3 p-[var(--gutter,1rem)]`}
    >
      {content}
    </div>
  );
}

/**
 * Progress (DESIGN.md: Progress): how ready you are, what to do next, what you have done. Exactly
 * one measured percentage, "Readiness"; everywhere else counts and words.
 */
export function ProgressView({
  history,
  exam = null,
  now,
  onRepeat = () => {},
  onPractise = () => {},
  resultHref = () => null,
}: {
  history: FinishedSession[];
  /** The assigned exam with the nearest deadline, if any. */
  exam?: AssignedExam | null;
  now: Date;
  onRepeat?: () => void;
  /** Starts (or resumes) practice of a topic. */
  onPractise?: (topicId: string) => void;
  /** The results screen a session can still open, or null. */
  resultHref?: (session: FinishedSession) => string | null;
}) {
  const { sections } = useSourceSheet();
  const titleOf = (id: string) => sections.find((section) => section.id === id)?.title ?? id;
  const recent = recentSessions(history, RECENT_SESSIONS);
  return (
    <div className="flex flex-col gap-6 pb-4">
      <HeaderRow
        title={<h1 className="type-page-title">Progress</h1>}
        subtitle={<p className="type-small text-text-secondary">How you are doing over time.</p>}
      />

      <ReadinessSection exam={exam} history={history} now={now} onRepeat={onRepeat} />
      <TopicsSection exam={exam} history={history} titleOf={titleOf} onPractise={onPractise} />

      {history.length === 0 ? (
        <EmptyState
          icon={History}
          text="No sessions yet. Start with Choose a topic."
          action={
            <ButtonLink variant="secondary" href="/training">
              Choose a topic
            </ButtonLink>
          }
        />
      ) : (
        <>
          <p className="type-small text-text-secondary tabular-nums" data-activity>
            {activityLabel(activitySummary(history))}
          </p>
          <section aria-labelledby="recent-sessions" className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 id="recent-sessions" className="type-item-title">
                Recent sessions
              </h2>
              <div className="-mr-3">
                <ButtonLink variant="tertiary" href={sessionsPath}>
                  See all
                </ButtonLink>
              </div>
            </div>
            <ol className="flex flex-col gap-3">
              {recent.map((session) => (
                <li key={session.finishedAt}>
                  <SessionRow
                    session={session}
                    now={now}
                    titleOf={titleOf}
                    href={resultHref(session)}
                  />
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}

/** The full list of sessions, newest first, 10 at a time. */
export function SessionsListView({
  history,
  now,
  resultHref = () => null,
}: {
  history: FinishedSession[];
  now: Date;
  resultHref?: (session: FinishedSession) => string | null;
}) {
  const { sections } = useSourceSheet();
  const titleOf = (id: string) => sections.find((section) => section.id === id)?.title ?? id;
  const [shown, setShown] = useState(HISTORY_PAGE);
  const { visible, hasMore } = visibleHistory(recentSessions(history, history.length), shown);
  return (
    <div className="flex flex-col gap-6 pb-4">
      <CircleBackButton href="/progress" label="Back to Progress" />
      <h1 className="type-page-title">Sessions</h1>
      {history.length === 0 ? (
        <EmptyState icon={History} text="No sessions yet. Start with Choose a topic." />
      ) : (
        <ol className="flex flex-col gap-3">
          {visible.map((session) => (
            <li key={session.finishedAt}>
              <SessionRow
                session={session}
                now={now}
                titleOf={titleOf}
                href={resultHref(session)}
              />
            </li>
          ))}
        </ol>
      )}
      {hasMore && (
        <div className="-ml-3">
          <Button variant="tertiary" onClick={() => setShown(seeMore(shown))}>
            See more
          </Button>
        </div>
      )}
    </div>
  );
}
