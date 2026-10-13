"use client";

import { ActionBar } from "@/components/ActionBar/ActionBar";
import { AnswerDock } from "@/components/AnswerDock/AnswerDock";
import { Button } from "@/components/Button/Button";
import { ChoiceCard } from "@/components/ChoiceCard/ChoiceCard";
import { ConfidenceSelector } from "@/components/ConfidenceSelector/ConfidenceSelector";
import { OrderingList } from "@/components/OrderingList/OrderingList";
import { SessionTopBar } from "@/components/SessionTopBar/SessionTopBar";
import type { Unit } from "@/components/SessionTopBar/SessionTopBar";
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
  ordering: "Drag the handles to reorder",
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
      // Typed in the answer dock at the bottom of the screen.
      return null;
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

/**
 * One quiz question. Confidence is optional; Check needs only an answer. Short text is typed in
 * the answer dock, with "I don't know". Once submitted, the answer sheet rises over it.
 */
export function QuizQuestion({
  question,
  index,
  total,
  unit = "Question",
  draft,
  onDraftChange,
  onSubmit,
  onDontKnow,
  submitted = false,
}: {
  question: Question;
  index: number;
  total: number;
  unit?: Unit;
  draft: QuizDraft;
  onDraftChange: (draft: QuizDraft) => void;
  onSubmit: (draft: QuizDraft) => void;
  onDontKnow?: () => void;
  submitted?: boolean;
}) {
  const answered = hasAnswer(draft.response);
  const hint =
    question.type === "multiple"
      ? `Select all that apply (${question.answer.length} are correct).`
      : hints[question.type];

  return (
    <div className="flex flex-col gap-6">
      <SessionTopBar index={index} total={total} unit={unit} />
      <div className="flex flex-col items-start gap-3">
        <Tag>{`Guide ${question.section}`}</Tag>
        <h1 className="type-item-title">{question.question}</h1>
        <p className="type-small text-text-secondary">{hint}</p>
      </div>

      <Answer
        question={question}
        response={draft.response}
        onChange={(response) => onDraftChange({ ...draft, response })}
      />

      {question.type === "text" && submitted && (
        <p className="max-w-[85%] self-end rounded-panel bg-surface-muted px-4 py-2">
          {draft.response?.type === "text" && draft.response.text
            ? draft.response.text
            : "I don't know"}
        </p>
      )}

      {answered && !submitted && (
        <ConfidenceSelector
          name={`confidence-${question.id}`}
          legend="How sure are you? (optional)"
          value={draft.confidence}
          onChange={(confidence) => onDraftChange({ ...draft, confidence })}
        />
      )}

      {!submitted && question.type === "text" && (
        <AnswerDock
          label={question.question}
          placeholder={question.placeholder}
          value={draft.response?.type === "text" ? draft.response.text : ""}
          onChange={(text) => onDraftChange({ ...draft, response: { type: "text", text } })}
          onSend={(text) => onSubmit({ ...draft, response: { type: "text", text } })}
          onDontKnow={() => onDontKnow?.()}
        />
      )}
      {!submitted && question.type !== "text" && (
        <ActionBar>
          {!answered && (
            <p className="type-small text-center text-text-secondary">
              Answer the question to continue.
            </p>
          )}
          <Button disabled={!answered} onClick={() => onSubmit(draft)}>
            Check
          </Button>
        </ActionBar>
      )}
    </div>
  );
}
