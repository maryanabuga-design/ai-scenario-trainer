"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { ARROW_CLEARANCE, ArrowCircle } from "@/components/ArrowCircle/ArrowCircle";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Chip } from "@/components/Chip/Chip";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { Media3D } from "@/components/Media3D/Media3D";
import { cardPictureFiles } from "@/lib/media-frames";
import { PASS_MARK } from "@/lib/config";
import { conclusion, isPassed, passCount, resultPercent } from "@/lib/results";
import { correctCount } from "@/lib/scoring";
import type { ScoredItem } from "@/lib/scoring";
import { sessionLabel } from "@/lib/session";
import type { SessionKind } from "@/lib/session";
import type { WeakTopic } from "@/lib/weak-topics";
import { topicsToRepeat } from "@/lib/weak-topics";

export const reviewPath = (position: number) => `/session/results/review/${position}`;
export const weakTopicsPath = "/weak-topics?from=results";
const scrollKey = "ast.results-scroll";

/** Remembers where Results was scrolled to, so Back from a review returns there. */
function rememberScroll() {
  try {
    sessionStorage.setItem(scrollKey, String(window.scrollY));
  } catch {
    // Without storage, Back simply opens Results at the top.
  }
}

function useRestoredScroll() {
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(scrollKey);
    } catch {
      return;
    }
    if (saved === null) return;
    const top = Number(saved);
    // After the page has painted, so the router's own scroll to the top does not undo it.
    const frame = requestAnimationFrame(() => {
      window.scrollTo(0, top);
      try {
        sessionStorage.removeItem(scrollKey);
      } catch {
        // Nothing to clean up without storage.
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);
}

/**
 * The result on a bar with a marker at the pass mark. A practice session shows a count ("7 of 10
 * correct") and the pass mark as a count; only an exam shows a percentage, the "Score" (DESIGN.md:
 * the percentage vocabulary).
 */
function ResultBar({ items, kind }: { items: ScoredItem[]; kind: SessionKind }) {
  const total = items.length;
  const correct = correctCount(items);
  const percent = resultPercent(items);
  const needed = passCount(total);
  const exam = kind === "exam";
  return (
    <div className="flex flex-col gap-2">
      <p className="type-numeral text-center tabular-nums">
        {exam ? `Score ${percent}%` : `${correct} of ${total} correct`}
      </p>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={correct}
        aria-label={
          exam
            ? `Score ${percent}%, pass mark ${needed} of ${total}`
            : `${correct} of ${total} correct, pass mark ${needed} of ${total}`
        }
        className="relative h-3 rounded-full bg-secondary-sand-pressed"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        <span
          aria-hidden="true"
          className="absolute -top-1 -bottom-1 w-0.5 bg-text"
          style={{ left: `${PASS_MARK}%` }}
        />
      </div>
      <p className="type-label relative h-4 text-text-secondary" aria-hidden="true">
        <span
          className="absolute -translate-x-1/2 whitespace-nowrap"
          style={{ left: `${PASS_MARK}%` }}
        >
          PASS MARK: {needed} of {total}
        </span>
      </p>
    </div>
  );
}

/** The weak topics of the person, with their sections; opens the Weak topics page. */
function WeakTopicsCard({ topics }: { topics: WeakTopic[] }) {
  return (
    <Link
      href={weakTopicsPath}
      onClick={rememberScroll}
      className="relative flex flex-col gap-3 rounded-card bg-card p-5 shadow-(--card-shadow) has-focus-visible:outline-2"
    >
      <ArrowCircle />
      <span className={`flex flex-col gap-1 ${ARROW_CLEARANCE.md}`}>
        <span className="type-card-title">Weak topics</span>
        <span className="type-small text-text-secondary">{topicsToRepeat(topics.length)}</span>
      </span>
      <span className="flex flex-wrap gap-2">
        {topics.map((topic) => (
          <Chip key={topic.sectionId} tone="sand" size="caption">
            {topic.sectionId}
          </Chip>
        ))}
      </span>
    </Link>
  );
}

/**
 * The Results buttons. In one row the secondary "Review answers" is on the left and the primary
 * "Repeat weak topics" on the right, equal width. The row wraps by itself when they do not fit
 * (wrap-reverse puts the primary on top again), with no measuring. With nothing to repeat,
 * "Review answers" stands alone.
 */
export function ResultsActions({
  canRepeat,
  onRepeat,
  onReview,
  reviewHref = reviewPath(1),
}: {
  canRepeat: boolean;
  onRepeat: () => void;
  onReview?: () => void;
  reviewHref?: string;
}) {
  const review = (
    <ButtonLink href={reviewHref} variant="secondary" snug onClick={onReview}>
      Review answers
    </ButtonLink>
  );
  if (!canRepeat) return review;
  return (
    <div className="flex flex-wrap-reverse gap-3 [&>div]:flex-[1_1_11.5rem] [&>div]:whitespace-nowrap">
      <div>{review}</div>
      <div>
        <Button snug onClick={onRepeat}>
          Repeat weak topics
        </Button>
      </div>
    </div>
  );
}

/**
 * The Results buttons by situation. An exam that failed: Primary "Repeat weak topics" and Secondary
 * "Back to exam"; an exam that passed, or a repeat session for an exam: Primary "Done" (to the exam
 * screen); each with a Secondary "Review answers". Any other session keeps the Review / Repeat row.
 */
export function ResultsButtons({
  kind,
  passed,
  canRepeat,
  examRepeat,
  onRepeat,
  reviewHref,
  doneHref,
}: {
  kind: SessionKind;
  passed: boolean;
  canRepeat: boolean;
  /** A repeat session for an assigned exam: it ends with Done (to the exam screen). */
  examRepeat: boolean;
  onRepeat: () => void;
  reviewHref?: string;
  doneHref: string;
}) {
  const exam = kind === "exam";
  if (!exam && !examRepeat) {
    return (
      <ResultsActions
        canRepeat={canRepeat}
        onRepeat={onRepeat}
        onReview={rememberScroll}
        reviewHref={reviewHref}
      />
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {exam && !passed ? (
        <>
          <Button onClick={onRepeat}>Repeat weak topics</Button>
          <ButtonLink href={doneHref} variant="secondary">
            Back to exam
          </ButtonLink>
        </>
      ) : (
        <ButtonLink href={doneHref}>Done</ButtonLink>
      )}
      <ButtonLink href={reviewHref ?? reviewPath(1)} variant="secondary" onClick={rememberScroll}>
        Review answers
      </ButtonLink>
    </div>
  );
}

/**
 * Results: hero, Passed or Not passed yet, the result against the pass mark, one conclusion and the
 * weak topics. A practice session shows counts; an exam shows its Score (the one percentage).
 */
export function ResultsView({
  kind,
  items,
  topics,
  backHref = "/",
  backLabel,
  reviewHref,
  onRepeat,
  examRepeat = false,
  doneHref,
}: {
  kind: SessionKind;
  items: ScoredItem[];
  /** The weak topics from the saved history: they decide what "Repeat weak topics" brings back. */
  topics: WeakTopic[];
  /** Where Back goes: where the session was started from (Training), Home otherwise. */
  backHref?: string;
  /** The name of the Back destination; Home or Training by default. */
  backLabel?: string;
  /** The first Answer review page; the normal session's by default. */
  reviewHref?: string;
  onRepeat: () => void;
  /** A repeat session for an assigned exam: Done goes to the exam screen. */
  examRepeat?: boolean;
  /** Where the Primary "Done" goes (the exam screen), for an exam or an exam repeat session. */
  doneHref?: string;
}) {
  useRestoredScroll();
  const passed = isPassed(items);
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-[44px_1fr_44px] items-center">
        <CircleBackButton
          href={backHref}
          label={backLabel ?? (backHref === "/" ? "Back to Home" : "Back to Training")}
        />
        <h1 className="type-item-title text-center">Results</h1>
      </div>

      <section aria-labelledby="result-title" className="flex flex-col items-center gap-3">
        <Media3D
          variant="hero"
          src={passed ? cardPictureFiles.resultPass : cardPictureFiles.resultRetry}
          priority
        />
        <p className="type-label text-text-secondary">{sessionLabel({ kind })}</p>
        <h2 id="result-title" className="type-display text-center">
          {passed ? "Passed" : "Not passed yet"}
        </h2>
      </section>

      <ResultBar items={items} kind={kind} />

      <p className="text-center text-text-secondary">{conclusion(items)}</p>

      {topics.length > 0 && <WeakTopicsCard topics={topics} />}

      <ActionBar>
        <ResultsButtons
          kind={kind}
          passed={passed}
          canRepeat={topics.length > 0}
          examRepeat={examRepeat}
          onRepeat={onRepeat}
          reviewHref={reviewHref}
          doneHref={doneHref ?? backHref}
        />
      </ActionBar>
    </div>
  );
}
