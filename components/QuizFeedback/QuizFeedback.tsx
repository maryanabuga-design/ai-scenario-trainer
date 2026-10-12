"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { SessionTopBar } from "@/components/SessionTopBar/SessionTopBar";
import type { Unit } from "@/components/SessionTopBar/SessionTopBar";
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
  if (question.type === "text") {
    return (
      <div className="flex flex-col gap-3">
        {[
          { label: "Your answer", text: describeResponse(question, response) || "No answer" },
          { label: "Reference answer", text: describeAnswer(question) },
        ].map((panel) => (
          <div key={panel.label} className="flex flex-col gap-1 rounded-panel bg-surface-muted p-4">
            <Label>{panel.label}</Label>
            <p>{panel.text}</p>
          </div>
        ))}
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
  markedCorrect = false,
  onMarkCorrect,
  index,
  total,
  unit = "Question",
  nextLabel,
  onNext,
}: {
  question: Question;
  response: Response;
  confidence: Confidence | null;
  /** A short answer the user marked correct after the keyword check rejected it. */
  markedCorrect?: boolean;
  onMarkCorrect?: () => void;
  index: number;
  total: number;
  unit?: Unit;
  nextLabel: string;
  onNext: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const scored = scoreQuestion(question, response, confidence, markedCorrect);
  const text = question.type === "text";
  const verdict = scored.markedByYou
    ? "marked"
    : text
      ? scored.correct
        ? "looks_correct"
        : "no_match"
      : scored.correct
        ? "correct"
        : scored.score > 0
          ? "partial"
          : "wrong";
  const [first, second] = {
    correct: ["Right.", "Here is why."],
    partial: ["Partly right.", "See what you missed."],
    wrong: ["Not quite.", "See what the guide says."],
    looks_correct: ["Looks right.", "Compare it with the reference answer."],
    no_match: ["Not matched.", "Compare it with the reference answer. You decide."],
    marked: ["Marked correct.", "Your call counts in the score."],
  }[verdict];

  return (
    <div className="flex flex-col gap-6">
      <SessionTopBar index={index} total={total} unit={unit} />
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl leading-tight font-medium">
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
        {verdict === "no_match" && onMarkCorrect && (
          <div>
            <Button
              variant="secondary"
              onClick={() => {
                // The button disappears, so move focus to the new headline.
                onMarkCorrect();
                headingRef.current?.focus();
              }}
            >
              My answer is still correct
            </Button>
          </div>
        )}
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
