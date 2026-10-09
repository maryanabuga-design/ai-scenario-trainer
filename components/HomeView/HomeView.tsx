"use client";

import Link from "next/link";
import { Gradient } from "@/components/Gradient/Gradient";
import { RepeatSummary } from "@/components/RepeatSummary/RepeatSummary";
import { Tag } from "@/components/Tag/Tag";
import { sessionLabel } from "@/lib/progress";
import { getScenario, scenario, sessionLengths } from "@/lib/scenario";
import type { ScoredItem } from "@/lib/scoring";
import type { Session } from "@/lib/session";
import type { WeakTopic } from "@/lib/weak-topics";
import { isQuiz, isRepeatRound, itemCount } from "@/lib/session";

export function HomeView({
  directionTitle,
  unfinished,
  weakItems,
  onRepeat,
}: {
  directionTitle: string;
  unfinished: Session | null;
  weakItems: ScoredItem[];
  onRepeat: (topics: WeakTopic[]) => void;
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
          <Link
            href="/session"
            className="flex flex-col gap-2 rounded-card bg-surface p-4 hover:bg-surface-muted"
          >
            <div>
              <Tag
                tone={
                  isRepeatRound(unfinished)
                    ? "yellow"
                    : isQuiz(unfinished)
                      ? "blue"
                      : unfinished.mode === "short"
                        ? "peach"
                        : "lilac"
                }
              >
                {sessionLabel(unfinished)}
              </Tag>
            </div>
            <p className="font-serif text-xl">
              {isRepeatRound(unfinished)
                ? `Weak topics: ${unfinished.topics.join(", ")}`
                : isQuiz(unfinished)
                  ? `Quiz on ${unfinished.sections.join(", ")}`
                  : getScenario(unfinished.scenarioId).title}
            </p>
            <p className="text-sm text-text-secondary tabular-nums">
              {isRepeatRound(unfinished) ? "Item" : isQuiz(unfinished) ? "Question" : "Step"}{" "}
              {unfinished.index + 1} of {itemCount(unfinished)}
            </p>
            <span className="text-sm font-medium underline underline-offset-4">Continue</span>
          </Link>
        </section>
      )}

      <RepeatSummary weakItems={weakItems} onRepeat={onRepeat} />

      <section aria-labelledby="new-title" className="flex flex-col gap-3">
        <h2 id="new-title" className="text-lg font-medium">
          New scenario
        </h2>
        <Link
          href="/training/evacuation-guide"
          className="flex flex-col gap-2 rounded-card bg-surface p-4 hover:bg-surface-muted"
        >
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
          <p className="text-sm text-text-secondary">
            Or take a quiz on any guide sections, with five kinds of questions.
          </p>
          <span className="text-sm font-medium underline underline-offset-4">Create training</span>
        </Link>
      </section>
    </div>
  );
}
