"use client";

import type { ReactNode } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { Gradient } from "@/components/Gradient/Gradient";
import { SourceChip } from "@/components/SourceChip/SourceChip";
import { StatusBadge, StatusIcon, statuses } from "@/components/StatusBadge/StatusBadge";
import { formatSelfCheck } from "@/lib/explanation-match";
import type { SelfCheck } from "@/lib/explanation-match";
import { describeEffects, formatMetric } from "@/lib/outcome";
import { formatPoints } from "@/lib/progress";
import { getScenario } from "@/lib/scenario";
import type { SessionMode } from "@/lib/scenario";
import type { ScoredItem } from "@/lib/scoring";
import {
  countErrorTypes,
  errorTypes,
  sumEffects,
  totalScore,
  weakItems,
  weakSections,
} from "@/lib/scoring";

/** Which session the results belong to. */
export type ResultsKind =
  | { kind: "scenario"; mode: SessionMode; scenarioId?: string }
  | { kind: "quiz"; mode: "quiz" | "repeat" }
  | { kind: "repeat" };

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
  return [first, `Review ${weakTopicCount} ${weakTopicCount === 1 ? "topic" : "topics"} below.`];
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 py-2">
      <span>{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function ResultsView({
  results,
  items,
  selfCheck = null,
  onRepeat,
}: {
  results: ResultsKind;
  items: ScoredItem[];
  /** The self-check over the session's steps; null for a quiz. Never part of the score. */
  selfCheck?: SelfCheck | null;
  onRepeat: (ids: string[]) => void;
}) {
  const quiz = results.kind === "quiz";
  const correct = items.filter((item) => item.correct).length;
  const counts = countErrorTypes(items);
  const scenarioDef = getScenario(results.kind === "scenario" ? results.scenarioId : undefined);
  const outcome = sumEffects(scenarioDef.initialState, items);
  const repeatIds = weakItems(items).map((item) => item.id);
  const topics = weakSections(items);
  const [first, second] = headline(results, topics.length);
  const showOutcome = results.kind === "scenario" && results.mode !== "repeat";
  const outcomeRows = scenarioDef.outcome.filter(
    (metric) =>
      results.kind === "scenario" &&
      results.mode !== "repeat" &&
      (!metric.lengths || metric.lengths.includes(results.mode)),
  );
  const timeline = items.filter((item) => item.kind === "step" && item.consequence);
  const hasQuestions = items.some((item) => item.kind === "question");
  const markedCount = items.filter((item) => item.markedByYou).length;
  const shortEnding =
    results.kind === "scenario" && results.mode === "short" ? scenarioDef.shortEnding : undefined;

  return (
    <div className="flex flex-col gap-8">
      <Gradient tone="warm" className="-mx-4 -mt-6 px-4 pt-12 pb-10">
        <h1 className="text-3xl leading-tight font-medium">
          {first} <span className="text-text-secondary">{second}</span>
        </h1>
      </Gradient>

      {shortEnding && <p className="text-text-secondary">{shortEnding.continues}</p>}

      <Card className="flex flex-col gap-2">
        {quiz && (
          <p className="px-1 pb-1 text-lg font-medium tabular-nums">
            {formatPoints(totalScore(items))} of {items.length} points
          </p>
        )}
        {[
          { status: "correct" as const, label: "correct", count: correct },
          {
            status: "wrong" as const,
            label: quiz ? "not fully correct" : "incorrect",
            count: items.length - correct,
          },
        ].map((row) => (
          <div
            key={row.status}
            className="flex min-h-14 items-center gap-4 rounded-panel bg-surface-muted px-3 py-2"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-panel ${statuses[row.status].className}`}
            >
              <StatusIcon status={row.status} size={18} />
            </span>
            <span className="flex-1 text-lg">
              <span className="tabular-nums">{row.count}</span> {row.label}
            </span>
          </div>
        ))}
      </Card>

      <Section title="Error types">
        <div className="flex flex-col divide-y divide-border">
          {errorTypes.map((type) => (
            <Row
              key={type}
              label={
                <span className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={type} />
                  <span className="text-sm text-text-secondary">{statuses[type].description}</span>
                </span>
              }
              value={counts[type]}
            />
          ))}
        </div>
      </Section>

      {showOutcome && outcomeRows.length > 0 && (
        <Section title="How the situation ended">
          <div className="flex flex-col divide-y divide-border">
            {outcomeRows.map((metric) => (
              <Row
                key={metric.key}
                label={metric.label}
                value={formatMetric(
                  metric,
                  outcome[metric.key],
                  scenarioDef.initialState[metric.key],
                )}
              />
            ))}
          </div>
        </Section>
      )}

      {timeline.length > 0 && (
        <Section title="What happened">
          <ol className="flex flex-col gap-4">
            {timeline.map((item, position) => (
              <li key={item.id} className="flex gap-3">
                <span className="w-5 shrink-0 text-text-secondary tabular-nums">
                  {position + 1}.
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm">{item.consequence}</p>
                  {describeEffects(item.id, item.effects).length > 0 && (
                    <p className="text-sm text-text-secondary">
                      {describeEffects(item.id, item.effects).join(" · ")}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      <Section title="Error analysis">
        <ol className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className={item.kind === "step" ? "font-serif text-lg" : "font-medium"}>
                    {item.title}
                  </h3>
                  <StatusBadge status={item.errorType} />
                </div>
                <p className="text-sm">
                  <span className="text-text-secondary">
                    {item.kind === "step" ? "You chose: " : "Your answer: "}
                  </span>
                  {item.yourAnswer || "No answer"}
                </p>
                {!item.correct && (
                  <p className="text-sm">
                    <span className="text-text-secondary">
                      {item.kind === "step" ? "Better: " : "Correct answer: "}
                    </span>
                    {item.correctAnswer}
                  </p>
                )}
                {item.markedByYou && (
                  <div>
                    <StatusBadge status="marked" />
                  </div>
                )}
                <div className="flex flex-col gap-1 text-sm">
                  <span className="text-text-secondary">Why</span>
                  {item.why.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                {item.kind === "question" && item.score > 0 && item.score < 1 && (
                  <p className="text-sm text-text-secondary tabular-nums">
                    Partly correct: {formatPoints(item.score)} of 1 point
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {item.sources.map((sectionId) => (
                    <SourceChip key={sectionId} sectionId={sectionId} />
                  ))}
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Weak topics">
        {topics.length === 0 ? (
          <p className="text-text-secondary">No weak topics. Every answer was right and sure.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {topics.map((sectionId) => (
              <SourceChip key={sectionId} sectionId={sectionId} showTitle />
            ))}
          </div>
        )}
      </Section>

      {(selfCheck || hasQuestions) && (
        <div className="flex flex-col divide-y divide-border border-y border-border text-sm">
          {selfCheck && (
            <div className="flex min-h-11 flex-wrap items-center gap-x-2 py-2">
              <span className="text-text-secondary">Explained in your own words:</span>
              <span className="font-medium tabular-nums">
                {formatSelfCheck(selfCheck)}
                {selfCheck !== "skipped" && " (self-checked)"}
              </span>
            </div>
          )}
          {hasQuestions && (
            <div className="flex min-h-11 flex-wrap items-center gap-x-2 py-2">
              <span className="text-text-secondary">Marked correct by you:</span>
              <span className="font-medium tabular-nums">{markedCount}</span>
            </div>
          )}
        </div>
      )}

      <ActionBar>
        {repeatIds.length > 0 ? (
          <>
            <p className="text-center text-sm text-text-secondary">
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
