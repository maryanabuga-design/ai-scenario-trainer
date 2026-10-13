"use client";

import { ArrowRight, Check, FileQuestionMark, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { QuizAmountPicker } from "@/components/QuizAmountPicker/QuizAmountPicker";
import { SectionList } from "@/components/SectionList/SectionList";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { Tag } from "@/components/Tag/Tag";
import type { Material } from "@/lib/materials";
import { availableLine, availableQuestions, fitAmount, questionCountLabel } from "@/lib/quiz-setup";
import { choiceProblem, defaultCreateAmount, planTraining } from "@/lib/training";
import type { TrainingChoice } from "@/lib/training";

export function initialChoice(material: Material): TrainingChoice {
  const plan = planTraining(material);
  return {
    scenario: plan.canScenario,
    quiz: true,
    sections: plan.sections,
    amount: defaultCreateAmount(plan.sections),
  };
}

/** One "What to create" card: sage tile with an icon, title, grey text, dark green check box. */
function CreateOption({
  icon: Icon,
  title,
  checked,
  disabled = false,
  onToggle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <label
      className={`flex min-h-18 items-center gap-3 rounded-card border p-4 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
        disabled
          ? "cursor-not-allowed border-transparent bg-neutral-surface text-text-secondary"
          : checked
            ? "cursor-pointer border-[1.5px] border-stroke-sage bg-next-card active:bg-secondary-pressed"
            : "cursor-pointer border-stroke-neutral bg-card shadow-(--card-shadow) active:bg-neutral-surface"
      }`}
    >
      <input
        type="checkbox"
        name="create"
        value={title}
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-next-tile text-text"
      >
        <Icon size={20} strokeWidth={2} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="type-body-strong">{title}</span>
        <span className="type-small text-text-secondary">{children}</span>
      </span>
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border ${
          disabled
            ? "border-dashed border-text-secondary"
            : checked
              ? "border-primary bg-primary text-primary-text"
              : "border-primary"
        }`}
      >
        {checked && !disabled && <Check size={14} strokeWidth={2.5} />}
      </span>
    </label>
  );
}

/** Create training: what to make from a material, which sections to keep and the quiz size. */
export function TrainingCreate({
  material,
  choice,
  onChange,
  onGenerate,
}: {
  material: Material;
  choice: TrainingChoice;
  onChange: (choice: TrainingChoice) => void;
  onGenerate: () => void;
}) {
  const { sections: guideSections } = useSourceSheet();
  const plan = planTraining(material);
  const problem = choiceProblem(plan, choice);
  const available = availableQuestions(choice.sections);
  const amount = choice.amount ?? defaultCreateAmount(choice.sections);
  const onlyOne = [choice.scenario, choice.quiz].filter(Boolean).length === 1;

  /** At least one of Scenario and Quiz must stay selected. */
  function toggle(kind: "scenario" | "quiz") {
    if (choice[kind] && onlyOne) return;
    onChange({ ...choice, [kind]: !choice[kind] });
  }

  return (
    <div className="flex flex-col gap-6">
      <CircleBackButton href={`/materials/${material.id}`} label="Back to material" />
      <div className="flex flex-col items-start gap-2">
        <Tag>Training</Tag>
        <h1 className="type-page-title">Create training</h1>
        <p className="break-words text-text-secondary">{material.name}</p>
      </div>

      {!plan.canScenario && (
        <p role="status" className="rounded-panel bg-neutral-surface px-4 py-3">
          Not enough material for a scenario. A quiz is available.
        </p>
      )}

      <section aria-labelledby="create-what" className="flex flex-col gap-3">
        <h2 id="create-what" className="type-item-title">
          What to create
        </h2>
        <CreateOption
          icon={FileText}
          title="Scenario"
          checked={choice.scenario}
          disabled={!plan.canScenario}
          onToggle={() => toggle("scenario")}
        >
          {plan.canScenario
            ? `${plan.scenarioDecisions} decisions, one story through the guide.`
            : "Needs more of the guide than this material holds."}
        </CreateOption>
        <CreateOption
          icon={FileQuestionMark}
          title="Quiz"
          checked={choice.quiz}
          onToggle={() => toggle("quiz")}
        >
          <span className="tabular-nums">{questionCountLabel(available)}</span> from the sections
          below.
        </CreateOption>
        {onlyOne && plan.canScenario && (
          <p className="type-small text-text-secondary">Choose a scenario, a quiz or both.</p>
        )}
      </section>

      <SectionList
        title="Sections found"
        titleId="create-sections"
        helper="The scenario is one prepared story through the guide. The sections you keep shape the quiz."
        sections={plan.sections.map((id) => ({
          id,
          title: guideSections.find((section) => section.id === id)?.title ?? id,
        }))}
        selected={choice.sections}
        onChange={(sections) =>
          onChange({ ...choice, sections, amount: fitAmount(amount, availableQuestions(sections)) })
        }
      />

      {choice.quiz && (
        <section className="flex flex-col gap-2">
          <QuizAmountPicker
            name="create-count"
            amount={amount}
            available={available}
            hasSections={choice.sections.length > 0}
            onChange={(next) => onChange({ ...choice, amount: next })}
          />
          <p aria-live="polite" className="type-small text-text-secondary tabular-nums">
            {availableLine(choice.sections)}
          </p>
        </section>
      )}

      <ActionBar>
        {problem && <p className="type-small text-center text-text-secondary">{problem}</p>}
        <Button disabled={problem !== null} onClick={onGenerate}>
          <span className="inline-flex items-center gap-2">
            Generate
            <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
          </span>
        </Button>
      </ActionBar>
    </div>
  );
}
