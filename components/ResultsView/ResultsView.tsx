"use client";

import type { ReactNode } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { Gradient } from "@/components/Gradient/Gradient";
import { SourceChip } from "@/components/SourceChip/SourceChip";
import { StatusBadge, StatusIcon, statuses } from "@/components/StatusBadge/StatusBadge";
import { formatPoints } from "@/lib/progress";
import { scenario } from "@/lib/scenario";
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
  { kind: "scenario"; mode: SessionMode } | { kind: "quiz"; mode: "quiz" | "repeat" };

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest} s`;
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
}

function headline(results: ResultsKind, weakTopicCount: number): [string, string] {
  const first =
    results.kind === "quiz"
      ? results.mode === "repeat"
        ? "Repeat complete."
        : "Quiz complete."
      : {
          full: "Session complete.",
          extended: "Extended session complete.",
          short: "Short session: you reached the south stairwell.",
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
  onRepeat,
}: {
  results: ResultsKind;
  items: ScoredItem[];
  onRepeat: (ids: string[]) => void;
}) {
  const quiz = results.kind === "quiz";
  const correct = items.filter((item) => item.correct).length;
  const counts = countErrorTypes(items);
  const outcome = sumEffects(scenario.initialState, items);
  const repeatIds = weakItems(items).map((item) => item.id);
  const topics = weakSections(items);
  const [first, second] = headline(results, topics.length);
  const showOutcome = results.kind === "scenario" && results.mode !== "repeat";
  const showCasualty =
    results.kind === "scenario" && (results.mode === "full" || results.mode === "extended");

  return (
    <div className="flex flex-col gap-8">
      <Gradient tone="warm" className="-mx-4 -mt-6 px-4 pt-12 pb-10">
        <h1 className="text-3xl leading-tight font-medium">
          {first} <span className="text-text-secondary">{second}</span>
        </h1>
      </Gradient>

      {results.kind === "scenario" && results.mode === "short" && (
        <p className="text-text-secondary">
          The full session continues to an injured colleague, the call for help and the assembly
          point.
        </p>
      )}

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

      {showOutcome && (
        <Section title="How the situation ended">
          <div className="flex flex-col divide-y divide-border">
            <Row label="Time lost" value={formatTime(outcome.timeLostSeconds)} />
            <Row
              label="Smoke level"
              value={`${outcome.smokeLevel} (started at ${scenario.initialState.smokeLevel})`}
            />
            {showCasualty && (
              <Row
                label="Injured colleague"
                value={
                  outcome.casualtyStability < 0 ? `Worse (${outcome.casualtyStability})` : "Stable"
                }
              />
            )}
          </div>
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
