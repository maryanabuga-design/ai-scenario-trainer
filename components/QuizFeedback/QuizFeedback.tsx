"use client";

import type { ReactNode } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { SessionTopBar } from "@/components/SessionTopBar/SessionTopBar";
import { SourceChip } from "@/components/SourceChip/SourceChip";
import { StatusBadge, StatusIcon, statuses } from "@/components/StatusBadge/StatusBadge";
import { formatPoints } from "@/lib/progress";
import { describeAnswer, describeResponse, scoreQuestion } from "@/lib/quiz";
import type { Question, Response } from "@/lib/quiz";
import type { Confidence } from "@/lib/scenario";

function Label({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-medium tracking-[0.04em] text-text-secondary uppercase">
      {children}
    </h3>
  );
}

function Mark({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 text-xs font-medium ${ok ? "text-correct" : "text-wrong"}`}
    >
      <StatusIcon status={ok ? "correct" : "wrong"} size={12} />
      {label}
    </span>
  );
}

/** Your answer compared with the correct one, laid out for each question type. */
function Comparison({ question, response }: { question: Question; response: Response }) {
  if (question.type === "multiple" && response.type === "multiple") {
    return (
      <div className="flex flex-col gap-2">
        <Label>Your choices</Label>
        <ul className="flex flex-col gap-2">
          {question.options.map((option) => {
            const picked = response.optionIds.includes(option.id);
            const right = question.answer.includes(option.id);
            if (!picked && !right) return null;
            return (
              <li key={option.id} className="flex items-start justify-between gap-3">
                <span>{option.text}</span>
                {picked && right && <Mark ok label="Correct" />}
                {picked && !right && <Mark ok={false} label="Not correct" />}
                {!picked && right && <Mark ok={false} label="Missed" />}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
  if (question.type === "ordering" && response.type === "ordering") {
    const text = (id: string) => question.items.find((item) => item.id === id)?.text ?? id;
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Your order</Label>
          <ol className="flex flex-col gap-2">
            {response.order.map((id, index) => (
              <li key={id} className="flex items-start justify-between gap-3">
                <span>
                  <span className="text-text-secondary tabular-nums">{index + 1}. </span>
                  {text(id)}
                </span>
                {question.answer[index] === id ? (
                  <Mark ok label="In place" />
                ) : (
                  <Mark ok={false} label="Moved" />
                )}
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Correct order</Label>
          <ol className="flex flex-col gap-2">
            {question.answer.map((id, index) => (
              <li key={id}>
                <span className="text-text-secondary tabular-nums">{index + 1}. </span>
                {text(id)}
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="flex flex-col gap-1">
        <Label>Your answer</Label>
        <p>{describeResponse(question, response) || "No answer"}</p>
      </div>
      <div className="flex flex-col gap-1">
        <Label>Correct answer</Label>
        <p>{describeAnswer(question)}</p>
      </div>
    </>
  );
}

export function QuizFeedback({
  question,
  response,
  confidence,
  index,
  total,
  nextLabel,
  onNext,
}: {
  question: Question;
  response: Response;
  confidence: Confidence | null;
  index: number;
  total: number;
  nextLabel: string;
  onNext: () => void;
}) {
  const scored = scoreQuestion(question, response, confidence);
  const verdict = scored.correct ? "correct" : scored.score > 0 ? "partial" : "wrong";
  const [first, second] =
    verdict === "correct"
      ? ["Right.", "Here is why."]
      : verdict === "partial"
        ? ["Partly right.", "See what you missed."]
        : ["Not quite.", "See what the guide says."];

  return (
    <div className="flex flex-col gap-6">
      <SessionTopBar index={index} total={total} unit="Question" />
      <h1 className="text-2xl leading-tight font-medium">
        {first} <span className="text-text-secondary">{second}</span>
      </h1>

      <Card className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={verdict} />
          <span className="text-sm text-text-secondary tabular-nums">
            {formatPoints(scored.score)} of 1 point
          </span>
        </div>
        <p className="font-medium">{question.question}</p>
        <Comparison question={question} response={response} />
        <div className="flex flex-col gap-1">
          <Label>Why</Label>
          <p>{question.why}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Error type</Label>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={scored.errorType} />
            <span className="text-sm text-text-secondary">
              {confidence === null ? "No confidence given" : statuses[scored.errorType].description}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {scored.sources.map((sectionId) => (
            <SourceChip key={sectionId} sectionId={sectionId} showTitle />
          ))}
        </div>
      </Card>

      <ActionBar>
        <Button onClick={onNext}>{nextLabel}</Button>
      </ActionBar>
    </div>
  );
}
