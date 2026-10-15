"use client";

import { useId } from "react";
import { Button } from "@/components/Button/Button";
import { ContentImage } from "@/components/ContentImage/ContentImage";
import { SelectableCard } from "@/components/SelectableCard/SelectableCard";
import { ConfidenceSelector } from "@/components/ConfidenceSelector/ConfidenceSelector";
import { OrderingList } from "@/components/OrderingList/OrderingList";
import { GuideChip } from "@/components/GuideChip/GuideChip";
import type { Question, Response } from "@/lib/quiz";
import { isQuizComplete } from "@/lib/session-draft";
import type { QuizDraft } from "@/lib/session-draft";

const hints: Record<Question["type"], string> = {
  single: "Choose one answer.",
  multiple: "",
  ordering: "Drag the handles to reorder",
  text: "A few words are enough.",
  truefalse: "Is this true or false?",
};

const letters = "ABCDEFGH";

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
          {question.options.map((option, position) => (
            <SelectableCard
              key={option.id}
              size="row"
              letter={letters[position]}
              name={question.id}
              value={option.id}
              checked={response?.type === "single" && response.optionId === option.id}
              onChange={(optionId) => onChange({ type: "single", optionId })}
            >
              {option.text}
            </SelectableCard>
          ))}
        </div>
      );
    case "multiple": {
      const selected = response?.type === "multiple" ? response.optionIds : [];
      return (
        <div className="flex flex-col gap-3">
          {question.options.map((option, position) => (
            <SelectableCard
              key={option.id}
              size="row"
              letter={letters[position]}
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
            </SelectableCard>
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
        <TextAnswer
          question={question}
          value={response?.type === "text" ? response.text : ""}
          onChange={(text) => onChange({ type: "text", text })}
        />
      );
    case "truefalse":
      return (
        <div className="grid grid-cols-2 gap-3">
          {[true, false].map((value) => (
            <SelectableCard
              key={String(value)}
              name={question.id}
              value={String(value)}
              checked={response?.type === "truefalse" && response.value === value}
              onChange={() => onChange({ type: "truefalse", value })}
            >
              {value ? "True" : "False"}
            </SelectableCard>
          ))}
        </div>
      );
  }
}

function TextAnswer({
  question,
  value,
  onChange,
}: {
  question: Extract<Question, { type: "text" }>;
  value: string;
  onChange: (text: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="sr-only">
        {question.question}
      </label>
      <textarea
        id={id}
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={question.placeholder}
        autoComplete="off"
        className="type-body min-h-24 w-full resize-y rounded-card border border-border-strong bg-surface p-3 placeholder:text-text-secondary"
      />
    </div>
  );
}

/**
 * One quiz question: the optional image, the section chip, the question, the answer and the
 * optional confidence. A short text question has "I don't know", which counts as an answer. It
 * shows no verdict; that comes in the results.
 */
export function QuizQuestion({
  question,
  draft,
  onDraftChange,
}: {
  question: Question;
  draft: QuizDraft;
  onDraftChange: (draft: QuizDraft) => void;
}) {
  const answered = isQuizComplete(draft);
  const hint =
    question.type === "multiple"
      ? `Select all that apply (${question.answer.length} are correct).`
      : hints[question.type];

  return (
    <div className="flex flex-col gap-6">
      <ContentImage image={question.image} />
      <div className="flex flex-col items-start gap-3">
        <GuideChip sectionId={question.section} />
        <h1 className="type-item-title">{question.question}</h1>
        <p className="type-small text-text-secondary">{hint}</p>
      </div>

      <Answer
        question={question}
        response={draft.response}
        onChange={(response) => onDraftChange({ ...draft, response, dontKnow: false })}
      />

      {question.type === "text" && (
        <div className="-mt-3 -ml-3">
          <Button
            variant="tertiary"
            onClick={() =>
              onDraftChange({
                response: { type: "text", text: "" },
                confidence: null,
                dontKnow: true,
              })
            }
          >
            I don&apos;t know
          </Button>
        </div>
      )}

      {draft.dontKnow && (
        <p role="status" className="type-small -mt-3 text-text-secondary">
          Marked as I don&apos;t know. Type an answer to replace it.
        </p>
      )}

      {answered && !draft.dontKnow && (
        <ConfidenceSelector
          name={`confidence-${question.id}`}
          legend="How sure are you? (optional)"
          value={draft.confidence}
          onChange={(confidence) => onDraftChange({ ...draft, confidence })}
        />
      )}
    </div>
  );
}
