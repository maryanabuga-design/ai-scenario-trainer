"use client";

import { ArrowDown, ArrowUp, ChevronDown, Minus } from "lucide-react";
import { useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { ProfileAvatar } from "@/components/ProfileAvatar/ProfileAvatar";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { ReadinessBar } from "@/components/ReadinessBar/ReadinessBar";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { stepsCard } from "@/components/StepsView/StepCard";
import type { AssignedExam } from "@/lib/assigned-exams";
import {
  allTopicIds,
  changeText,
  readinessChange,
  readinessCard,
  topicGroups,
} from "@/lib/progress-view";
import type { TopicProgress } from "@/lib/progress-view";
import { hasWeakTopics } from "@/lib/readiness";
import type { FinishedSession } from "@/lib/session";
import { examPath } from "@/lib/weak-session";

const focusClass =
  "active:bg-secondary-sand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * The change line: how readiness moved with the last session, in points (no percent sign, so
 * Readiness stays the one percentage). Up is the success colour on the icon; no change and down are
 * neutral. Never red.
 */
function ChangeLine({ delta }: { delta: number }) {
  const Icon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;
  return (
    <p
      data-readiness-change
      className="type-small -mt-2 flex items-center gap-1.5 text-neutral-tile-ink"
    >
      <Icon
        size={16}
        strokeWidth={2}
        aria-hidden="true"
        data-change-icon={delta > 0 ? "up" : delta < 0 ? "down" : "none"}
        className={`shrink-0 ${delta > 0 ? "text-status-success-ink" : "text-neutral-tile-ink"}`}
      />
      <span className="min-w-0 truncate">{changeText(delta)}</span>
    </p>
  );
}

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
  const change = readinessChange(history, card.readiness);
  return (
    <section
      aria-labelledby="exam-readiness"
      className="flex flex-col gap-4 rounded-card bg-card p-4 shadow-(--card-shadow)"
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 id="exam-readiness" className="type-item-title">
          {card.title}
        </h2>
        {card.subtitle && (
          <p
            data-readiness-exam
            title={card.subtitle}
            className="type-small truncate text-text-secondary"
          >
            {card.subtitle}
          </p>
        )}
      </div>
      <p className="type-numeral tabular-nums" data-readiness-number>
        Readiness {card.readiness}%
      </p>
      <ReadinessBar percent={card.readiness} />
      {change !== null && <ChangeLine delta={change} />}
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

/**
 * One topic: a card of EXACTLY 80px (the Steps list card), one tap target that practises the topic.
 * The title is one line, cut with an ellipsis; "X of N correct" and a thin bar tell the state.
 */
function TopicRow({
  row,
  title,
  onPractise,
}: {
  row: TopicProgress;
  title: string;
  onPractise: (topicId: string) => void;
}) {
  const share = row.total === 0 ? 0 : (row.correct / row.total) * 100;
  return (
    <button
      type="button"
      data-topic-row={row.sectionId}
      onClick={() => onPractise(row.sectionId)}
      className={`${stepsCard} flex h-[var(--list-card-height,80px)] w-full items-center gap-3 px-[var(--gutter,1rem)] text-left ${focusClass}`}
    >
      <span
        aria-hidden="true"
        className="type-caption flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-olive-tint text-text"
      >
        {row.sectionId}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span data-topic-title className="type-body truncate">
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
      <Chevron />
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
 * "By topic": ONE list in number order, the exam's topics first ("In your exam") and the others
 * behind ONE underlined text toggle at the end of the list ("Show other topics (N)" / "Hide other
 * topics"), closed until it is opened. Without an exam every topic
 * is listed under "Topics".
 */
function TopicsSection({
  exam,
  history,
  titleOf,
  onPractise,
  initiallyOpen,
}: {
  exam: AssignedExam | null;
  history: FinishedSession[];
  titleOf: (id: string) => string;
  onPractise: (topicId: string) => void;
  initiallyOpen: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { inExam, other } = topicGroups(exam?.topicIds ?? null, history);

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    // Safari does not focus a button on click: keep the focus on the toggle, which stays in place
    event.currentTarget.focus();
    const closing = open;
    setOpen(!open);
    if (!closing) return;
    // Hide: the page gets shorter; once the transition has run the toggle is brought back into view
    // if it ended up outside the screen.
    window.setTimeout(() => {
      wrapperRef.current?.querySelector("button")?.scrollIntoView({ block: "nearest" });
    }, 220);
  }
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
      {inExam.length === 0 ? (
        <div className="flex flex-col gap-3">
          <h3 className="type-label text-text-secondary">Topics</h3>
          <TopicList rows={other} titleOf={titleOf} onPractise={onPractise} />
        </div>
      ) : (
        <div ref={wrapperRef} className="flex flex-col">
          {/* the group opens and closes with a height transition; closed, it is inert (not focusable) */}
          <div
            id="other-topics"
            inert={!open}
            className={`grid transition-[grid-template-rows,visibility] duration-200 motion-reduce:transition-none ${open ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]"}`}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="flex flex-col gap-3 pb-3">
                <h3 className="type-label text-text-secondary">Other topics</h3>
                <TopicList rows={other} titleOf={titleOf} onPractise={onPractise} />
              </div>
            </div>
          </div>
          <div className="-ml-3 self-start">
            <Button
              variant="tertiary"
              aria-expanded={open}
              aria-controls="other-topics"
              onClick={toggle}
              trailing={
                <ChevronDown
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                  className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
                />
              }
            >
              {open ? "Hide other topics" : `Show other topics (${other.length})`}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Progress (DESIGN.md: Progress): how ready you are and what to practise next. Exactly one measured
 * percentage, "Readiness"; the topic list shows counts only.
 */
export function ProgressView({
  history,
  exam = null,
  now,
  onRepeat = () => {},
  onPractise = () => {},
  otherOpen = false,
}: {
  history: FinishedSession[];
  /** The assigned exam with the nearest deadline, if any. */
  exam?: AssignedExam | null;
  now: Date;
  onRepeat?: () => void;
  /** Starts (or resumes) practice of a topic. */
  onPractise?: (topicId: string) => void;
  /** Only for the screen review page: the other topics start open. */
  otherOpen?: boolean;
}) {
  const { sections } = useSourceSheet();
  const titleOf = (id: string) => sections.find((section) => section.id === id)?.title ?? id;
  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title="Progress"
        subtitle="How you are doing over time."
        action={<ProfileAvatar />}
      />
      <div className="flex flex-col gap-6">
        <ReadinessSection exam={exam} history={history} now={now} onRepeat={onRepeat} />
        <TopicsSection
          exam={exam}
          history={history}
          titleOf={titleOf}
          onPractise={onPractise}
          initiallyOpen={otherOpen}
        />
      </div>
    </div>
  );
}
