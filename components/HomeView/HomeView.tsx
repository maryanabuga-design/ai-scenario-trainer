"use client";

import { ActionBar } from "@/components/ActionBar/ActionBar";
import { ButtonLink } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { Gradient } from "@/components/Gradient/Gradient";
import { Tag } from "@/components/Tag/Tag";
import { WeakTopics } from "@/components/WeakTopics/WeakTopics";
import { modeLabels } from "@/lib/progress";
import { scenario, sessionLengths } from "@/lib/scenario";
import type { ScoredAnswer } from "@/lib/scoring";
import type { Session } from "@/lib/session";

export function HomeView({
  directionTitle,
  unfinished,
  weakAnswers,
  onPractise,
}: {
  directionTitle: string;
  unfinished: Session | null;
  weakAnswers: ScoredAnswer[];
  onPractise: (stepIds: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <Gradient
        tone="warm"
        className="-mx-4 -mt-6 flex flex-col items-start gap-4 px-4 pt-10 pb-10"
      >
        <Tag tone="yellow">{directionTitle}</Tag>
        <h1 className="text-3xl leading-tight font-medium">
          Practise a decision.{" "}
          <span className="text-text-secondary">Explain it, then check it against the guide.</span>
        </h1>
      </Gradient>

      {unfinished && (
        <section aria-labelledby="continue-title" className="flex flex-col gap-3">
          <h2 id="continue-title" className="text-lg font-medium">
            Continue session
          </h2>
          <Card className="flex flex-col gap-2">
            <div>
              <Tag tone={unfinished.mode === "short" ? "peach" : "lilac"}>
                {modeLabels[unfinished.mode]}
              </Tag>
            </div>
            <p className="font-serif text-xl">{scenario.title}</p>
            <p className="text-sm text-text-secondary tabular-nums">
              Step {unfinished.index + 1} of {unfinished.stepIds.length}
            </p>
          </Card>
        </section>
      )}

      <WeakTopics weakAnswers={weakAnswers} onPractise={onPractise} />

      <section aria-labelledby="new-title" className="flex flex-col gap-3">
        <h2 id="new-title" className="text-lg font-medium">
          New scenario
        </h2>
        <Card className="flex flex-col gap-2">
          <div>
            <Tag tone="yellow">Scenario</Tag>
          </div>
          <p className="font-serif text-xl">{scenario.title}</p>
          <p className="text-sm text-text-secondary">
            Short: <span className="tabular-nums">{sessionLengths.short.stepIds.length}</span>{" "}
            decisions, about <span className="tabular-nums">{sessionLengths.short.minutes}</span>{" "}
            min. Full: <span className="tabular-nums">{sessionLengths.full.stepIds.length}</span>{" "}
            decisions, about <span className="tabular-nums">{sessionLengths.full.minutes}</span>{" "}
            min.
          </p>
          {unfinished && (
            <div className="mt-2">
              <ButtonLink href="/session/setup" variant="secondary">
                Start a new scenario
              </ButtonLink>
            </div>
          )}
        </Card>
      </section>

      <ActionBar>
        {unfinished ? (
          <ButtonLink href="/session">Continue session</ButtonLink>
        ) : (
          <ButtonLink href="/session/setup">New scenario</ButtonLink>
        )}
      </ActionBar>
    </div>
  );
}
