"use client";

import { useState } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { BackLink } from "@/components/BackLink/BackLink";
import { Button } from "@/components/Button/Button";
import { ChoiceCard } from "@/components/ChoiceCard/ChoiceCard";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import type { Material } from "@/lib/materials";
import { questionsFor } from "@/lib/quiz";
import { choiceProblem, planTraining } from "@/lib/training";
import type { TrainingChoice } from "@/lib/training";

export function initialChoice(material: Material): TrainingChoice {
  const plan = planTraining(material);
  return { scenario: plan.canScenario, quiz: true, sections: plan.sections };
}

/** Create training: what to make from a material and which of its sections to keep. */
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
  const [keepOne, setKeepOne] = useState(false);
  const questionCount = questionsFor(choice.sections).length;

  function toggleSection(id: string) {
    const ticked = choice.sections.includes(id);
    if (ticked && choice.sections.length === 1) {
      setKeepOne(true);
      return;
    }
    setKeepOne(false);
    onChange({
      ...choice,
      sections: ticked
        ? choice.sections.filter((section) => section !== id)
        : plan.sections.filter((section) => section === id || choice.sections.includes(section)),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={`/materials/${material.id}`} label="Back to material" />
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl">Create training</h1>
        <p className="break-words text-text-secondary">{material.name}</p>
      </div>

      {!plan.canScenario && (
        <p role="status" className="rounded-panel bg-surface-muted px-4 py-3">
          Not enough material for a scenario. A quiz is available.
        </p>
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 font-medium">What to create</legend>
        <ChoiceCard
          type="checkbox"
          name="create"
          value="scenario"
          checked={choice.scenario}
          disabled={!plan.canScenario}
          onChange={() => onChange({ ...choice, scenario: !choice.scenario })}
        >
          <span className="flex flex-col gap-0.5">
            <span className="font-medium">Scenario</span>
            <span className="text-sm text-text-secondary">
              {plan.canScenario
                ? `${plan.scenarioDecisions} decisions, one story through the guide.`
                : "Needs more of the guide than this material holds."}
            </span>
          </span>
        </ChoiceCard>
        <ChoiceCard
          type="checkbox"
          name="create"
          value="quiz"
          checked={choice.quiz}
          onChange={() => onChange({ ...choice, quiz: !choice.quiz })}
        >
          <span className="flex flex-col gap-0.5">
            <span className="font-medium">Quiz</span>
            <span className="text-sm text-text-secondary">
              <span className="tabular-nums">{questionCount}</span>{" "}
              {questionCount === 1 ? "question" : "questions"} from the sections below.
            </span>
          </span>
        </ChoiceCard>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-3 font-medium">Sections found</legend>
        <p className="mb-1 text-sm text-text-secondary">
          The scenario is one prepared story through the guide. The sections you keep shape the
          quiz.
        </p>
        {plan.sections.map((id) => (
          <ChoiceCard
            key={id}
            type="checkbox"
            compact
            name="sections"
            value={id}
            checked={choice.sections.includes(id)}
            onChange={toggleSection}
          >
            <span className="flex items-baseline gap-3 text-sm">
              <span className="w-8 shrink-0 text-text-secondary tabular-nums">{id}</span>
              <span className="flex-1">
                {guideSections.find((section) => section.id === id)?.title}
              </span>
            </span>
          </ChoiceCard>
        ))}
        {keepOne && (
          <p role="status" className="text-sm text-text-secondary">
            Keep at least one section.
          </p>
        )}
      </fieldset>

      <ActionBar>
        {problem && <p className="text-center text-sm text-text-secondary">{problem}</p>}
        <Button disabled={problem !== null} onClick={onGenerate}>
          Generate
        </Button>
      </ActionBar>
    </div>
  );
}
