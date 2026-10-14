"use client";

import { useEffect } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button, ButtonLink } from "@/components/Button/Button";
import { ErrorTypesCard } from "@/components/ErrorTypesCard/ErrorTypesCard";
import { ProgressCard } from "@/components/ProgressCard/ProgressCard";
import { ResultsHeader } from "@/components/ResultsHeader/ResultsHeader";
import { SoftCard } from "@/components/SoftCard/SoftCard";
import { GuideChip } from "@/components/GuideChip/GuideChip";
import { StatusChip } from "@/components/StatusChip/StatusChip";
import { formatOutcome } from "@/lib/outcome";
import { formatPoints, sessionLabel } from "@/lib/progress";
import type { ResultsKind } from "@/lib/repeat";
import { conclusion } from "@/lib/results";
import { getScenario } from "@/lib/scenario";
import type { ScoredItem } from "@/lib/scoring";
import { countErrorTypes, sumEffects, totalScore, weakItems, weakSections } from "@/lib/scoring";

export const analysisPath = "/session/results/analysis";
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

function headline(results: ResultsKind, weakTopicCount: number): [string, string] {
  const first =
    results.kind === "repeat"
      ? "Repeat complete."
      : results.kind === "quiz"
        ? results.mode === "repeat"
          ? "Repeat complete."
          : "Quiz complete."
        : results.mode === "short"
          ? (getScenario(results.scenarioId).shortEnding?.headline ?? "Session complete.")
          : {
              full: "Session complete.",
              extended: "Extended session complete.",
              repeat: "Repeat complete.",
            }[results.mode];
  if (weakTopicCount === 0) return [first, "Nothing to repeat this time."];
  return [first, `${weakTopicCount} ${weakTopicCount === 1 ? "topic" : "topics"} to repeat.`];
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
  const scenarioResults = results.kind === "scenario" && results.mode !== "repeat";
  const correct = items.filter((item) => item.correct).length;
  const scenarioDef = getScenario(results.kind === "scenario" ? results.scenarioId : undefined);
  const state = sumEffects(scenarioDef.initialState, items);
  const repeatIds = weakItems(items).map((item) => item.id);
  const topics = weakSections(items);
  const [first, second] = headline(results, topics.length);
  const outcomeRows = scenarioDef.outcome.filter(
    (metric) =>
      results.kind === "scenario" &&
      results.mode !== "repeat" &&
      (!metric.lengths || metric.lengths.includes(results.mode)),
  );
  const steps = items.filter((item) => item.kind === "step" && item.consequence);
  const hasQuestions = items.some((item) => item.kind === "question");
  const markedCount = items.filter((item) => item.markedByYou).length;
  const shortEnding =
    results.kind === "scenario" && results.mode === "short" ? scenarioDef.shortEnding : undefined;

  return (
    <div className="flex flex-col gap-4">
      <ResultsHeader overline={sessionLabel(results)} first={first} second={second} />

      <ProgressCard
        correct={correct}
        total={items.length}
        sentence={shortEnding?.continues ?? conclusion(items)}
        points={quiz ? `${formatPoints(totalScore(items))} of ${items.length} points` : undefined}
      />

      <ErrorTypesCard
        counts={countErrorTypes(items)}
        detailsHref={analysisPath}
        onNavigate={rememberScroll}
      />

      {scenarioResults && outcomeRows.length > 0 && (
        <SoftCard title="Outcome" titleId="outcome-title" className="gap-1">
          <dl className="flex flex-col divide-y divide-soft-divider">
            {outcomeRows.map((metric) => (
              <div
                key={metric.key}
                className="flex min-h-12 items-center justify-between gap-4 py-2"
              >
                <dt>{metric.label}</dt>
                <dd className="type-body-strong text-right">
                  {formatOutcome(
                    scenarioDef,
                    metric,
                    state[metric.key],
                    scenarioDef.initialState[metric.key],
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </SoftCard>
      )}

      {scenarioResults && steps.length > 0 && (
        <SoftCard title="Step by step" titleId="steps-title" subtitle="How each choice played out">
          <ol className="flex flex-col gap-4">
            {steps.map((item, position) => (
              <li key={item.id} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="type-small flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary tabular-nums"
                >
                  {position + 1}
                </span>
                <div className="flex min-w-0 flex-col gap-0.5 pt-1">
                  <h3 className="type-body-strong">
                    <span className="sr-only">Step {position + 1}: </span>
                    {item.title}
                  </h3>
                  {item.markedByYou && (
                    <span className="py-1">
                      <StatusChip status="marked" />
                    </span>
                  )}
                  {item.note && <p className="type-small text-text-secondary">{item.note}</p>}
                  <p className="type-small text-text-secondary">{item.consequence}</p>
                </div>
              </li>
            ))}
          </ol>
        </SoftCard>
      )}

      <SoftCard title="Weak topics" titleId="weak-title">
        {topics.length === 0 ? (
          <p className="text-text-secondary">No weak topics. Every answer was right and sure.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {topics.map((sectionId) => (
              <GuideChip key={sectionId} sectionId={sectionId} showTitle />
            ))}
          </div>
        )}
        {(hasQuestions || markedCount > 0) && (
          <div className="flex min-h-11 items-center justify-between gap-4 border-t border-soft-divider pt-3">
            <span>Marked correct by you</span>
            <span className="type-body-strong tabular-nums">{markedCount}</span>
          </div>
        )}
      </SoftCard>

      <ActionBar>
        {repeatIds.length > 0 ? (
          <>
            <p className="type-small text-center text-text-secondary">
              Replays <span className="tabular-nums">{repeatIds.length}</span>{" "}
              {quiz
                ? repeatIds.length === 1
                  ? "question"
                  : "questions"
                : repeatIds.length === 1
                  ? "step"
                  : "steps"}{" "}
              you got wrong, partly right or guessed.
            </p>
            <Button onClick={() => onRepeat(repeatIds)}>
              {quiz ? "Repeat weak questions" : "Repeat weak topics"}
            </Button>
            <ButtonLink href="/" variant="text">
              Back to Home
            </ButtonLink>
          </>
        ) : (
          <ButtonLink href="/">Back to Home</ButtonLink>
        )}
      </ActionBar>
    </div>
  );
}
