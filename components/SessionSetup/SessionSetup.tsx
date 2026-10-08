"use client";

import { ActionBar } from "@/components/ActionBar/ActionBar";
import { BackLink } from "@/components/BackLink/BackLink";
import { Button } from "@/components/Button/Button";
import { ChoiceCard } from "@/components/ChoiceCard/ChoiceCard";
import { PillGroup } from "@/components/PillGroup/PillGroup";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { Stepper } from "@/components/Stepper/Stepper";
import { Tag } from "@/components/Tag/Tag";
import { questionsFor, quizCounts } from "@/lib/quiz";
import { getScenario } from "@/lib/scenario";
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

/** How many questions the quiz will have: the chosen count, never more than the bank holds. */
export function quizSize(value: SetupValue) {
  const available = questionsFor(value.sections).length;
  const wanted = value.countChoice === "custom" ? value.customCount : value.countChoice;
  return { available, size: Math.min(wanted, available) };
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
  training?: Pick<Training, "materialId" | "scenario" | "quiz" | "sections">;
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
  const { available, size } = quizSize(value);
  const quiz = value.mode === "quiz";
  const blocked = quiz && value.sections.length === 0;

  function toggleSection(id: string) {
    const next = value.sections.includes(id)
      ? value.sections.filter((section) => section !== id)
      : [...value.sections, id];
    onChange({ ...value, sections: sections.map((s) => s.id).filter((s) => next.includes(s)) });
  }

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={`/materials/${training?.materialId ?? "evacuation-guide"}`} />
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-2xl">Session setup</h1>
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
          <legend className="mb-3 font-medium">How long do you want to practise?</legend>
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
                      <span className="text-lg font-medium">
                        <span className="tabular-nums">{length.stepIds.length}</span> decisions
                      </span>
                      <span className="text-sm text-text-secondary">
                        About <span className="tabular-nums">{length.minutes}</span> min (estimate).{" "}
                        {length.summary}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm">Not available for this material</span>
                  )}
                </span>
              </ChoiceCard>
            );
          })}
        </fieldset>
      )}

      {quiz && (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-3 flex w-full items-center justify-between font-medium">
              Guide sections
            </legend>
            <div className="-mt-1 mb-1">
              <Button
                variant="text"
                onClick={() =>
                  onChange({
                    ...value,
                    sections:
                      value.sections.length === sections.length ? [] : sections.map((s) => s.id),
                  })
                }
              >
                {value.sections.length === sections.length ? "Clear all" : "Select all"}
              </Button>
            </div>
            {sections.map((section) => (
              <ChoiceCard
                key={section.id}
                type="checkbox"
                compact
                name="sections"
                value={section.id}
                checked={value.sections.includes(section.id)}
                onChange={toggleSection}
              >
                <span className="flex items-baseline gap-3 text-sm">
                  <span className="w-8 shrink-0 text-text-secondary tabular-nums">
                    {section.id}
                  </span>
                  <span className="flex-1">{section.title}</span>
                  <span className="text-text-secondary tabular-nums">
                    {questionsFor([section.id]).length}
                  </span>
                </span>
              </ChoiceCard>
            ))}
          </fieldset>

          <PillGroup
            name="count"
            legend="How many questions?"
            options={[
              ...quizCounts.map((count) => ({
                value: count as SetupValue["countChoice"],
                label: String(count),
                disabled: value.sections.length > 0 && count > available,
              })),
              { value: "custom" as const, label: "Custom" },
            ]}
            value={value.countChoice}
            onChange={(countChoice) => onChange({ ...value, countChoice })}
          />
          {value.countChoice === "custom" && (
            <Stepper
              label="Number of questions"
              value={Math.min(value.customCount, Math.max(1, available))}
              min={1}
              max={Math.max(1, available)}
              onChange={(customCount) => onChange({ ...value, customCount })}
            />
          )}
          {value.sections.length > 0 && (
            <p className="text-sm text-text-secondary">
              These sections have <span className="tabular-nums">{available}</span> questions. Your
              quiz has <span className="tabular-nums">{size}</span>. Answering how sure you are is
              optional.
            </p>
          )}
        </>
      )}

      {!quiz && (
        <p className="text-sm text-text-secondary">
          At each step you choose an action, say how sure you are and explain your choice in one
          sentence.
        </p>
      )}

      <ActionBar>
        {replacesUnfinished && (
          <p className="text-center text-sm text-text-secondary">
            Starting replaces your unfinished session.
          </p>
        )}
        {blocked && (
          <p className="text-center text-sm text-text-secondary">
            Choose at least one guide section to continue.
          </p>
        )}
        <Button disabled={blocked} onClick={onStart}>
          {quiz ? "Start quiz" : "Start session"}
        </Button>
      </ActionBar>
    </div>
  );
}
