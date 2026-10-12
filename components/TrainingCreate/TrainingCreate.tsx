"use client";

import { ActionBar } from "@/components/ActionBar/ActionBar";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { Button } from "@/components/Button/Button";
import { ChoiceCard } from "@/components/ChoiceCard/ChoiceCard";
import { SectionList } from "@/components/SectionList/SectionList";
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
  const questionCount = questionsFor(choice.sections).length;

  return (
    <div className="flex flex-col gap-6">
      <CircleBackButton href={`/materials/${material.id}`} label="Back to material" />
      <div className="flex flex-col gap-1">
        <h1 className="type-page-title">Create training</h1>
        <p className="break-words text-text-secondary">{material.name}</p>
      </div>

      {!plan.canScenario && (
        <p role="status" className="rounded-panel bg-surface-muted px-4 py-3">
          Not enough material for a scenario. A quiz is available.
        </p>
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="type-body-strong mb-3">What to create</legend>
        <ChoiceCard
          type="checkbox"
          name="create"
          value="scenario"
          checked={choice.scenario}
          disabled={!plan.canScenario}
          onChange={() => onChange({ ...choice, scenario: !choice.scenario })}
        >
          <span className="flex flex-col gap-0.5">
            <span className="type-body-strong">Scenario</span>
            <span className="type-small text-text-secondary">
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
            <span className="type-body-strong">Quiz</span>
            <span className="type-small text-text-secondary">
              <span className="tabular-nums">{questionCount}</span>{" "}
              {questionCount === 1 ? "question" : "questions"} from the sections below.
            </span>
          </span>
        </ChoiceCard>
      </fieldset>

      <SectionList
        title="Sections found"
        titleId="create-sections"
        helper="The scenario is one prepared story through the guide. The sections you keep shape the quiz."
        sections={plan.sections.map((id) => ({
          id,
          title: guideSections.find((section) => section.id === id)?.title ?? id,
        }))}
        selected={choice.sections}
        onChange={(sections) => onChange({ ...choice, sections })}
      />

      <ActionBar>
        {problem && <p className="type-small text-center text-text-secondary">{problem}</p>}
        <Button disabled={problem !== null} onClick={onGenerate}>
          Generate
        </Button>
      </ActionBar>
    </div>
  );
}
