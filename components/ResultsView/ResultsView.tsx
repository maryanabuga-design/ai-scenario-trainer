"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { ButtonLink, Button } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { ErrorTypesCard } from "@/components/ErrorTypesCard/ErrorTypesCard";
import { heroImages, HeroSlot } from "@/components/HeroSlot/HeroSlot";
import { StatusChip } from "@/components/StatusChip/StatusChip";
import { PASS_MARK } from "@/lib/config";
import { formatPoints, sessionLabel } from "@/lib/progress";
import type { ResultsKind } from "@/lib/repeat";
import { conclusion, isPassed, resultPercent } from "@/lib/results";
import type { ScoredItem } from "@/lib/scoring";
import { countErrorTypes, totalScore, weakItems } from "@/lib/scoring";

export const analysisPath = "/session/results/analysis";
export const reviewPath = (position: number) => `/session/results/review/${position}`;
const scrollKey = "ast.results-scroll";

/** Remembers where Results was scrolled to, so Back from the Error analysis returns there. */
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
    // After the page has painted, so the router's own scroll to the top does not undo it. The
    // position is forgotten only once it has been used (effects can run twice in development).
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
      <div className="relative h-5">
        <p
          className="type-small absolute -translate-x-1/2 whitespace-nowrap text-text-secondary"
          style={{ left: `${PASS_MARK}%` }}
        >
          Pass mark {PASS_MARK}%
        </p>
      </div>
    </div>
  );
}

/** One answer in "Your answers": number, short title, right or not right, error type, chevron. */
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
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="type-body-strong line-clamp-1">{item.title}</span>
          <span className="flex flex-wrap items-center gap-2">
            {item.hasConfidence && <StatusChip status={item.errorType} />}
            {item.markedByYou && (
              <span className="type-small text-text-secondary">Marked correct by you</span>
            )}
          </span>
        </span>
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

export function ResultsView({
  results,
  items,
  onRepeat,
}: {
  results: ResultsKind;
  items: ScoredItem[];
  onRepeat: (ids: string[]) => void;
}) {
  useRestoredScroll();
  const quiz = results.kind === "quiz";
  const passed = isPassed(items);
  const repeatIds = weakItems(items).map((item) => item.id);
  const hero = heroImages[passed ? "passed" : "notPassed"];

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="result-title" className="flex flex-col items-center gap-3">
        <HeroSlot kind={passed ? "passed" : "notPassed"} src={hero.src} alt={hero.alt} />
        <p className="type-label text-text-secondary">{sessionLabel(results)}</p>
        <h1 id="result-title" className="type-display text-center">
          {passed ? "Passed" : "Not passed yet"}
        </h1>
      </section>

      <ResultBar percent={resultPercent(items)} />

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-text-secondary">{conclusion(items)}</p>
        {quiz && (
          <p className="type-small text-text-secondary tabular-nums">
            {formatPoints(totalScore(items))} of {items.length} points
          </p>
        )}
      </div>

      <ErrorTypesCard
        counts={countErrorTypes(items)}
        detailsHref={analysisPath}
        onNavigate={rememberScroll}
      />

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
        {repeatIds.length > 0 ? (
          <Button onClick={() => onRepeat(repeatIds)}>
            {quiz ? "Repeat weak questions" : "Repeat weak topics"}
          </Button>
        ) : (
          <ButtonLink href="/">Start a new session</ButtonLink>
        )}
        <ButtonLink href="/" variant="tertiary">
          Back to Home
        </ButtonLink>
      </ActionBar>
    </div>
  );
}
