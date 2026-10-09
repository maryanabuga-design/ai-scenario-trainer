"use client";

import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { SessionTopBar } from "@/components/SessionTopBar/SessionTopBar";
import type { Unit } from "@/components/SessionTopBar/SessionTopBar";
import { SourceChip } from "@/components/SourceChip/SourceChip";
import { StatusBadge, StatusIcon, statuses } from "@/components/StatusBadge/StatusBadge";
import { SuggestedQuestion } from "@/components/SuggestedQuestion/SuggestedQuestion";
import { AskAiButton } from "@/components/AskAi/AskAi";
import type { Step } from "@/lib/scenario";
import { matchExplanation } from "@/lib/explanation-match";
import type { Feedback } from "@/lib/feedback";

function headline(feedback: Feedback): [string, string] {
  if (!feedback.correct) return ["Not the best action.", "See what the guide says."];
  if (feedback.errorType === "guess")
    return ["Right call.", "Check why, so it is not a guess next time."];
  return ["Right call.", "Here is why it works."];
}

function Label({ children }: { children: string }) {
  return (
    <h3 className="text-xs font-medium tracking-[0.04em] text-text-secondary uppercase">
      {children}
    </h3>
  );
}

export function FeedbackView({
  feedback,
  explanation,
  index,
  total,
  unit = "Step",
  nextLabel,
  onNext,
  step,
}: {
  feedback: Feedback;
  explanation: string;
  index: number;
  total: number;
  unit?: Unit;
  nextLabel: string;
  onNext: () => void;
  step: Step;
}) {
  const [first, second] = headline(feedback);
  const match = matchExplanation(step, explanation);

  return (
    <div className="flex flex-col gap-6">
      <SessionTopBar index={index} total={total} unit={unit} />
      <h1 className="text-2xl leading-tight font-medium">
        {first} <span className="text-text-secondary">{second}</span>
      </h1>

      <Card className="flex flex-col gap-5">
        <StatusBadge status={feedback.correct ? "correct" : "wrong"} />
        <div className="flex flex-col gap-1">
          <Label>Your answer</Label>
          <p>{feedback.chosen.text}</p>
        </div>
        {!feedback.correct && (
          <div className="flex flex-col gap-1">
            <Label>Better action</Label>
            <p>{feedback.best.text}</p>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <Label>Why</Label>
          <p>{feedback.chosen.why}</p>
          {!feedback.correct && <p>{feedback.best.why}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label>Error type</Label>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={feedback.errorType} />
            <span className="text-sm text-text-secondary">
              {statuses[feedback.errorType].description}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {feedback.sources.map((sectionId) => (
            <SourceChip key={sectionId} sectionId={sectionId} showTitle />
          ))}
        </div>
      </Card>

      <AskAiButton step={step} phase="feedback" />

      <div className="flex flex-col gap-8 border-t border-border pt-8 text-sm text-text-secondary">
        <section className="flex flex-col gap-1">
          <h2 className="font-medium text-text">What happened</h2>
          <p>{feedback.chosen.consequence}</p>
        </section>
        <section aria-labelledby="follow-up-title" className="flex flex-col gap-3">
          <h2 id="follow-up-title" className="font-medium text-text">
            AI follow-up
          </h2>
          <p className="text-base text-text">{feedback.followUp}</p>
          <div className="flex flex-col gap-1">
            <h3 className="font-medium text-text">Your explanation</h3>
            <p className="italic">{explanation}</p>
          </div>
          {match.percent !== null && (
            <div className="flex flex-col gap-2">
              <p className="font-medium text-text tabular-nums">
                Match with key points: {match.percent}%
              </p>
              <div
                role="progressbar"
                aria-label="Match with key points"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={match.percent}
                className="h-1 w-full overflow-hidden rounded-full bg-surface-muted"
              >
                <div className="h-full bg-text-secondary" style={{ width: `${match.percent}%` }} />
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <h3 className="font-medium text-text">Points a strong answer covers</h3>
            <ul className="flex flex-col gap-2">
              {match.beats.map(({ beat, covered }) => (
                <li key={beat} className="flex items-start justify-between gap-3">
                  <span>{beat}</span>
                  {match.percent !== null &&
                    (covered ? (
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-correct">
                        <StatusIcon status="correct" size={12} />
                        Covered
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-text-secondary">
                        <StatusIcon status="knowledge_gap" size={12} />
                        Missing
                      </span>
                    ))}
                </li>
              ))}
            </ul>
            <p>Simulated keyword match, for reference. It does not change your score.</p>
          </div>
        </section>
        <SuggestedQuestion step={step} />
      </div>

      <ActionBar>
        <Button onClick={onNext}>{nextLabel}</Button>
      </ActionBar>
    </div>
  );
}
