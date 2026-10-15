"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { ARROW_CLEARANCE, ArrowCircle } from "@/components/ArrowCircle/ArrowCircle";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { Chip } from "@/components/Chip/Chip";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { Media3D } from "@/components/Media3D/Media3D";
import { PASS_MARK } from "@/lib/config";
import { conclusion, isPassed, resultPercent } from "@/lib/results";
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

/** The result as a percentage on a bar with a marker at the pass mark. */
function ResultBar({ percent }: { percent: number }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="type-numeral text-center tabular-nums">{percent}%</p>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={`Result ${percent}%, pass mark ${PASS_MARK}%`}
        className="relative h-3 rounded-full bg-secondary-sand-pressed"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        <span
          aria-hidden="true"
          className="absolute -top-1 -bottom-1 w-0.5 bg-text"
          style={{ left: `${PASS_MARK}%` }}
        />
      </div>
      <div aria-hidden="true" className="type-caption flex justify-between text-text-secondary">
        <span>0</span>
        <span>100</span>
      </div>
      <p className="type-label relative -mt-1 h-4 text-text-secondary" aria-hidden="true">
        <span
          className="absolute -translate-x-1/2 whitespace-nowrap"
          style={{ left: `${PASS_MARK}%` }}
        >
          PASS MARK: {PASS_MARK}%
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

/** One answer in "Your answers": number, short title, right or not right, chevron. */
function AnswerRow({ item, position }: { item: ScoredItem; position: number }) {
  const Icon = item.correct ? Check : X;
  return (
    <li>
      <Link
        href={reviewPath(position)}
        onClick={rememberScroll}
        className="flex min-h-14 items-center gap-3 rounded-[20px] bg-card px-3 py-2 shadow-(--card-shadow) has-focus-visible:outline-2"
      >
        <span
          aria-hidden="true"
          className="type-small flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-sand tabular-nums"
        >
          {position}
        </span>
        <span className="type-body-strong line-clamp-1 min-w-0 flex-1">{item.title}</span>
        <Icon
          size={20}
          strokeWidth={2}
          role="img"
          aria-label={item.correct ? "Right" : "Not right"}
          className={`shrink-0 ${item.correct ? "text-correct" : "text-wrong"}`}
        />
        <Chevron />
      </Link>
    </li>
  );
}

/**
 * Results: hero, Passed or Not passed yet, the percentage against the pass mark, one conclusion,
 * the weak topics and every answer. Repeat or start again at the bottom.
 */
export function ResultsView({
  kind,
  items,
  topics,
  onRepeat,
}: {
  kind: SessionKind;
  items: ScoredItem[];
  /** The weak topics from the saved history: they decide what "Repeat weak topics" brings back. */
  topics: WeakTopic[];
  onRepeat: () => void;
}) {
  useRestoredScroll();
  const passed = isPassed(items);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-[44px_1fr_44px] items-center">
        <CircleBackButton href="/" label="Back to Home" />
        <h1 className="type-item-title text-center">Results</h1>
      </div>

      <section aria-labelledby="result-title" className="flex flex-col items-center gap-3">
        <Media3D variant="hero" />
        <p className="type-label text-text-secondary">{sessionLabel({ kind })}</p>
        <h2 id="result-title" className="type-display text-center">
          {passed ? "Passed" : "Not passed yet"}
        </h2>
      </section>

      <ResultBar percent={resultPercent(items)} />

      <p className="text-center text-text-secondary">{conclusion(items)}</p>

      {topics.length > 0 && <WeakTopicsCard topics={topics} />}

      <section aria-labelledby="answers-title" className="flex flex-col gap-3">
        <h2 id="answers-title" className="type-card-title">
          Your answers
        </h2>
        <ol className="flex flex-col gap-3">
          {items.map((item, index) => (
            <AnswerRow key={item.id} item={item} position={index + 1} />
          ))}
        </ol>
      </section>

      <ActionBar>
        {topics.length > 0 ? (
          <Button onClick={onRepeat}>Repeat weak topics</Button>
        ) : (
          <ButtonLink href="/">Start a new session</ButtonLink>
        )}
        <ButtonLink href={reviewPath(1)} variant="secondary" onClick={rememberScroll}>
          Review answers
        </ButtonLink>
        <ButtonLink href="/" variant="tertiary">
          Back to Home
        </ButtonLink>
      </ActionBar>
    </div>
  );
}
