"use client";

import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { SessionTopBar } from "@/components/SessionTopBar/SessionTopBar";
import type { Unit } from "@/components/SessionTopBar/SessionTopBar";
import { SourceChip } from "@/components/SourceChip/SourceChip";
import { StatusBadge, statuses } from "@/components/StatusBadge/StatusBadge";
import { SuggestedQuestion } from "@/components/SuggestedQuestion/SuggestedQuestion";
import { AskAiButton } from "@/components/AskAi/AskAi";
import type { Step } from "@/lib/scenario";
import { formatSelfCheck } from "@/lib/explanation-match";
import type { SelfCheck } from "@/lib/explanation-match";
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
  selfCheck,
  index,
  total,
  unit = "Step",
  nextLabel,
  onNext,
  step,
}: {
  feedback: Feedback;
  selfCheck: SelfCheck;
  index: number;
  total: number;
  unit?: Unit;
  nextLabel: string;
  onNext: () => void;
  step: Step;
}) {
  const [first, second] = headline(feedback);

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
          <p className="tabular-nums">Your explanation: {formatSelfCheck(selfCheck)}</p>
        </section>
        <SuggestedQuestion step={step} />
      </div>

      <ActionBar>
        <Button onClick={onNext}>{nextLabel}</Button>
      </ActionBar>
    </div>
  );
}
