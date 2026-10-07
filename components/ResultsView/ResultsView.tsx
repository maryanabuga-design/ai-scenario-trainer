"use client";

import type { ReactNode } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { Gradient } from "@/components/Gradient/Gradient";
import { SourceChip } from "@/components/SourceChip/SourceChip";
import { StatusBadge, StatusIcon, statuses } from "@/components/StatusBadge/StatusBadge";
import { scenario } from "@/lib/scenario";
import type { SessionMode } from "@/lib/scenario";
import type { ScoredAnswer } from "@/lib/scoring";
import { countErrorTypes, errorTypes, sumEffects, weakSections, weakStepIds } from "@/lib/scoring";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest} s`;
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
}

function headline(mode: SessionMode, weakTopicCount: number): [string, string] {
  const first = {
    full: "Session complete.",
    short: "Short session: you reached the south stairwell.",
    repeat: "Repeat complete.",
  }[mode];
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
  mode,
  answers,
  onRepeat,
}: {
  mode: SessionMode;
  answers: ScoredAnswer[];
  onRepeat: (stepIds: string[]) => void;
}) {
  const correct = answers.filter((answer) => answer.correct).length;
  const counts = countErrorTypes(answers);
  const outcome = sumEffects(scenario.initialState, answers);
  const repeatIds = weakStepIds(answers);
  const topics = weakSections(answers);
  const [first, second] = headline(mode, topics.length);

  return (
    <div className="flex flex-col gap-8">
      <Gradient tone="warm" className="-mx-4 -mt-6 px-4 pt-12 pb-10">
        <h1 className="text-3xl leading-tight font-medium">
          {first} <span className="text-text-secondary">{second}</span>
        </h1>
      </Gradient>

      {mode === "short" && (
        <p className="text-text-secondary">
          The full session continues to an injured colleague, the call for help and the assembly
          point.
        </p>
      )}

      <Card className="flex flex-col gap-2">
        {[
          { status: "correct" as const, label: "correct", count: correct },
          { status: "wrong" as const, label: "incorrect", count: answers.length - correct },
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

      {mode !== "repeat" && (
        <Section title="How the situation ended">
          <div className="flex flex-col divide-y divide-border">
            <Row label="Time lost" value={formatTime(outcome.timeLostSeconds)} />
            <Row
              label="Smoke level"
              value={`${outcome.smokeLevel} (started at ${scenario.initialState.smokeLevel})`}
            />
            {mode === "full" && (
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
          {answers.map((answer) => {
            const chosen = answer.step.options.find((option) => option.id === answer.optionId);
            const best = answer.step.options.find((option) => option.correct);
            return (
              <li key={answer.step.id}>
                <Card className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-serif text-lg">{answer.step.title}</h3>
                    <StatusBadge status={answer.errorType} />
                  </div>
                  <p className="text-sm">
                    <span className="text-text-secondary">You chose: </span>
                    {chosen?.text}
                  </p>
                  {!answer.correct && (
                    <p className="text-sm">
                      <span className="text-text-secondary">Better: </span>
                      {best?.text}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {answer.step.sources.map((sectionId) => (
                      <SourceChip key={sectionId} sectionId={sectionId} />
                    ))}
                  </div>
                </Card>
              </li>
            );
          })}
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
            <Button onClick={() => onRepeat(repeatIds)}>
              Repeat {repeatIds.length} weak {repeatIds.length === 1 ? "step" : "steps"}
            </Button>
            <ButtonLink href="/materials/evacuation-guide" variant="text">
              Back to the material
            </ButtonLink>
          </>
        ) : (
          <ButtonLink href="/materials/evacuation-guide">Back to the material</ButtonLink>
        )}
      </ActionBar>
    </div>
  );
}
