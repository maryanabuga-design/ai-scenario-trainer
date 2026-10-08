"use client";

import { useId } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { ChoiceCard } from "@/components/ChoiceCard/ChoiceCard";
import { ConfidenceSelector } from "@/components/ConfidenceSelector/ConfidenceSelector";
import { OrderingList } from "@/components/OrderingList/OrderingList";
import { SessionTopBar } from "@/components/SessionTopBar/SessionTopBar";
import { Tag } from "@/components/Tag/Tag";
import type { Question, Response } from "@/lib/quiz";
import type { Confidence } from "@/lib/scenario";

export type QuizDraft = { response: Response | null; confidence: Confidence | null };

/** The starting draft: ordering questions start from the order they are listed in. */
export function emptyQuizDraft(question: Question): QuizDraft {
  return {
    response:
      question.type === "ordering"
        ? { type: "ordering", order: question.items.map((item) => item.id) }
        : null,
    confidence: null,
  };
}

function hasAnswer(response: Response | null) {
  if (!response) return false;
  if (response.type === "multiple") return response.optionIds.length > 0;
  if (response.type === "text") return response.text.trim().length > 0;
  return true;
}

const hints: Record<Question["type"], string> = {
  single: "Choose one answer.",
  multiple: "",
  ordering: "Put the steps in order. Use the arrows or drag.",
  text: "A few words are enough.",
  truefalse: "Is this true or false?",
};

function Answer({
  question,
  response,
  onChange,
}: {
  question: Question;
  response: Response | null;
  onChange: (response: Response) => void;
}) {
  const inputId = useId();
  switch (question.type) {
    case "single":
      return (
        <div className="flex flex-col gap-3">
          {question.options.map((option) => (
            <ChoiceCard
              key={option.id}
              name={question.id}
              value={option.id}
              checked={response?.type === "single" && response.optionId === option.id}
              onChange={(optionId) => onChange({ type: "single", optionId })}
            >
              {option.text}
            </ChoiceCard>
          ))}
        </div>
      );
    case "multiple": {
      const selected = response?.type === "multiple" ? response.optionIds : [];
      return (
        <div className="flex flex-col gap-3">
          {question.options.map((option) => (
            <ChoiceCard
              key={option.id}
              type="checkbox"
              name={question.id}
              value={option.id}
              checked={selected.includes(option.id)}
              onChange={(id) =>
                onChange({
                  type: "multiple",
                  optionIds: question.options
                    .map((candidate) => candidate.id)
                    .filter((candidate) =>
                      candidate === id ? !selected.includes(id) : selected.includes(candidate),
                    ),
                })
              }
            >
              {option.text}
            </ChoiceCard>
          ))}
        </div>
      );
    }
    case "ordering":
      return (
        <OrderingList
          items={question.items}
          order={response?.type === "ordering" ? response.order : question.items.map((i) => i.id)}
          onChange={(order) => onChange({ type: "ordering", order })}
        />
      );
    case "text":
      return (
        <div className="flex flex-col gap-2">
          <label htmlFor={inputId} className="sr-only">
            Your answer
          </label>
          <input
            id={inputId}
            value={response?.type === "text" ? response.text : ""}
            onChange={(event) => onChange({ type: "text", text: event.target.value })}
            placeholder={question.placeholder}
            autoComplete="off"
            className="min-h-12 w-full rounded-panel border border-border-strong bg-surface px-4 text-base hover:border-text focus-visible:border-primary"
          />
        </div>
      );
    case "truefalse":
      return (
        <div className="grid grid-cols-2 gap-3">
          {[true, false].map((value) => (
            <ChoiceCard
              key={String(value)}
              name={question.id}
              value={String(value)}
              checked={response?.type === "truefalse" && response.value === value}
              onChange={() => onChange({ type: "truefalse", value })}
            >
              {value ? "True" : "False"}
            </ChoiceCard>
          ))}
        </div>
      );
  }
}

/** One quiz question. Confidence is optional; Check my answer needs only an answer. */
export function QuizQuestion({
  question,
  index,
  total,
  draft,
  onDraftChange,
  onSubmit,
}: {
  question: Question;
  index: number;
  total: number;
  draft: QuizDraft;
  onDraftChange: (draft: QuizDraft) => void;
  onSubmit: () => void;
}) {
  const answered = hasAnswer(draft.response);
  const hint =
    question.type === "multiple"
      ? `Select all that apply (${question.answer.length} are correct).`
      : hints[question.type];

  return (
    <div className="flex flex-col gap-6">
      <SessionTopBar index={index} total={total} unit="Question" />
      <div className="flex flex-col items-start gap-3">
        <Tag tone="blue">{`Guide ${question.section}`}</Tag>
        <h1 className="text-lg font-medium">{question.question}</h1>
        <p className="text-sm text-text-secondary">{hint}</p>
      </div>

      <Answer
        question={question}
        response={draft.response}
        onChange={(response) => onDraftChange({ ...draft, response })}
      />

      {answered && (
        <ConfidenceSelector
          name={`confidence-${question.id}`}
          legend="How sure are you? (optional)"
          value={draft.confidence}
          onChange={(confidence) => onDraftChange({ ...draft, confidence })}
        />
      )}

      <ActionBar>
        {!answered && (
          <p className="text-center text-sm text-text-secondary">
            Answer the question to continue.
          </p>
        )}
        <Button disabled={!answered} onClick={onSubmit}>
          Check my answer
        </Button>
      </ActionBar>
    </div>
  );
}
