"use client";

import { ActionBar } from "@/components/ActionBar/ActionBar";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { Button } from "@/components/Button/Button";
import { ChoiceCard } from "@/components/ChoiceCard/ChoiceCard";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { SectionList } from "@/components/SectionList/SectionList";
import { QuizAmountPicker } from "@/components/QuizAmountPicker/QuizAmountPicker";
import { Tag } from "@/components/Tag/Tag";
import { quizCounts } from "@/lib/quiz";
import {
  availableLine,
  availableQuestions,
  availableWithCap,
  fitAmount,
  questionCountLabel,
  quizAmount,
} from "@/lib/quiz-setup";
import { getScenario } from "@/lib/scenario";
import { keepOneHint } from "@/lib/sections";
import type { Length, ScenarioDef } from "@/lib/scenario";
import type { Training } from "@/lib/training";

export type { Length };

export type SetupValue = {
  mode: "scenario" | "quiz";
  length: Length;
  sections: string[];
  countChoice: (typeof quizCounts)[number] | "custom";
  customCount: number;
};

export const defaultSetup: SetupValue = {
  mode: "scenario",
  length: "full",
  sections: [],
  countChoice: 5,
  customCount: 8,
};

const lengthCards: { id: Length; tag: string; tone: "peach" | "lilac" | "blue" }[] = [
  { id: "short", tag: "Short", tone: "peach" },
  { id: "full", tag: "Full", tone: "lilac" },
  { id: "extended", tag: "Extended", tone: "blue" },
];

/**
 * How many questions the quiz will have: the chosen count, never more than the sections hold
 * nor than the quiz size saved with the training (cap).
 */
export function quizSize(value: SetupValue, cap?: number) {
  const available = availableWithCap(value.sections, cap);
  return { available, size: quizAmount(value, available) };
}

/** A setup whose amount fits the questions its sections hold and the saved quiz size. */
export function fitSetup(value: SetupValue, cap?: number): SetupValue {
  return fitAmount(value, availableWithCap(value.sections, cap));
}

export function SessionSetup({
  value,
  onChange,
  onStart,
  replacesUnfinished = false,
  training,
  materialName,
  scenarioDef = getScenario(undefined),
}: {
  /** The scenario of the material being trained; its lengths are the ones offered. */
  scenarioDef?: ScenarioDef;
  /** Shown under the title; the scenario's title when there is no training. */
  materialName?: string;
  /** The created training this setup belongs to; limits the modes and the quiz sections. */
  training?: Pick<Training, "materialId" | "scenario" | "quiz" | "sections" | "quizSize">;
  value: SetupValue;
  onChange: (value: SetupValue) => void;
  onStart: () => void;
  replacesUnfinished?: boolean;
}) {
  const { sections: guideSections } = useSourceSheet();
  const sections = training
    ? guideSections.filter((section) => training.sections.includes(section.id))
    : guideSections;
  const modes = [
    { value: "scenario" as const, label: "Scenario", allowed: !training || training.scenario },
    { value: "quiz" as const, label: "Quiz", allowed: !training || training.quiz },
  ].filter((mode) => mode.allowed);
  const cap = training?.quizSize;
  const { available, size } = quizSize(value, cap);
  const quiz = value.mode === "quiz";
  const blocked = quiz && value.sections.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <CircleBackButton
        href={`/materials/${training?.materialId ?? "evacuation-guide"}`}
        label="Back to material"
      />
      <div className="flex flex-col gap-1">
        <h1 className="type-page-title">Session setup</h1>
        <p className="break-words text-text-secondary">{materialName ?? scenarioDef.title}</p>
      </div>

      {modes.length > 1 ? (
        <SegmentedControl
          name="mode"
          legend="What do you want to do?"
          options={modes}
          value={value.mode}
          onChange={(mode) => onChange({ ...value, mode })}
        />
      ) : (
        <p className="text-text-secondary">
          This training has a {modes[0]?.value === "quiz" ? "quiz" : "scenario"} only.
        </p>
      )}

      {!quiz && (
        <fieldset className="flex flex-col gap-3">
          <legend className="type-body-strong mb-3">How long do you want to practise?</legend>
          {lengthCards.map((option) => {
            const length = scenarioDef.lengths[option.id];
            return (
              <ChoiceCard
                key={option.id}
                name="length"
                value={option.id}
                checked={value.length === option.id}
                disabled={!length}
                onChange={(next) => onChange({ ...value, length: next as Length })}
              >
                <span className="flex flex-col items-start gap-2">
                  <Tag tone={option.tone}>{option.tag}</Tag>
                  {length ? (
                    <>
                      <span className="type-item-title">
                        <span className="tabular-nums">{length.stepIds.length}</span> decisions
                      </span>
                      <span className="type-small text-text-secondary">
                        About <span className="tabular-nums">{length.minutes}</span> min (estimate).{" "}
                        {length.summary}
                      </span>
                    </>
                  ) : (
                    <span className="type-small">Not available for this material</span>
                  )}
                </span>
              </ChoiceCard>
            );
          })}
        </fieldset>
      )}

      {quiz && (
        <>
          <SectionList
            title="Guide sections"
            titleId="setup-sections"
            sections={sections.map((section) => ({
              id: section.id,
              title: section.title,
              detail: questionCountLabel(availableQuestions([section.id])),
            }))}
            selected={value.sections}
            onChange={(selected) => onChange(fitSetup({ ...value, sections: selected }, cap))}
          />
          <p aria-live="polite" className="type-small -mt-3 text-text-secondary tabular-nums">
            {availableLine(value.sections)}
          </p>

          <QuizAmountPicker
            name="count"
            amount={value}
            available={available}
            hasSections={value.sections.length > 0}
            onChange={(amount) => onChange({ ...value, ...amount })}
          />
          {value.sections.length > 0 && (
            <p className="type-small text-text-secondary">
              Your quiz has <span className="tabular-nums">{questionCountLabel(size)}</span>.
              Answering how sure you are is optional.
            </p>
          )}
        </>
      )}

      {!quiz && (
        <p className="type-small text-text-secondary">
          At each step you choose an action, say how sure you are and explain your choice in one
          sentence.
        </p>
      )}

      <ActionBar>
        {replacesUnfinished && (
          <p className="type-small text-center text-text-secondary">
            Starting replaces your unfinished session.
          </p>
        )}
        {blocked && <p className="type-small text-center text-text-secondary">{keepOneHint}</p>}
        <Button disabled={blocked} onClick={onStart}>
          {quiz ? "Start quiz" : "Start session"}
        </Button>
      </ActionBar>
    </div>
  );
}
