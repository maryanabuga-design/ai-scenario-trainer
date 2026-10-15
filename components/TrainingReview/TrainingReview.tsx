"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { GuideChip } from "@/components/GuideChip/GuideChip";
import { Tag } from "@/components/Tag/Tag";
import type { Material } from "@/lib/materials";
import { questionsFor } from "@/lib/quiz";
import { questionCountLabel } from "@/lib/setup";
import { getScenario } from "@/lib/scenario";
import type { Training } from "@/lib/training";

function Expandable({
  title,
  showLabel,
  hideLabel,
  children,
  defaultOpen = false,
}: {
  title: ReactNode;
  showLabel: string;
  hideLabel: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <Card className="flex flex-col gap-3">
      {title}
      <div className="-ml-3">
        <Button
          variant="tertiary"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
        >
          {open ? hideLabel : showLabel}
        </Button>
      </div>
      <div id={id} hidden={!open}>
        {children}
      </div>
    </Card>
  );
}

/** Review training: every situation and question with its sources, before starting. */
export function TrainingReview({
  material,
  training,
  onStart,
  expanded = false,
}: {
  material: Material;
  training: Training;
  onStart: () => void;
  /** Only for the screen review page: show both lists open. */
  expanded?: boolean;
}) {
  const scenarioDef = getScenario(material.scenarioId);
  const steps = scenarioDef.steps;
  const questions = questionsFor(training.sections);

  return (
    <div className="flex flex-col gap-6">
      <CircleBackButton href={`/materials/${material.id}`} label="Back to material" />
      <div className="flex flex-col gap-1">
        <h1 className="type-page-title">Your training is ready</h1>
        <p className="break-words text-text-secondary">{material.name}</p>
      </div>

      {training.scenario && (
        <Expandable
          defaultOpen={expanded}
          showLabel="Show all decisions"
          hideLabel="Hide decisions"
          title={
            <div className="flex flex-col items-start gap-2">
              <Tag tone="yellow">Scenario</Tag>
              <h2 className="type-item-title">
                Scenario: <span className="tabular-nums">{steps.length}</span> situations
              </h2>
              <p className="type-small text-text-secondary">{scenarioDef.title}.</p>
            </div>
          }
        >
          <ol className="flex flex-col divide-y divide-border">
            {steps.map((step, index) => (
              <li key={step.id} className="flex flex-col gap-2 py-3">
                <p>
                  <span className="text-text-secondary tabular-nums">{index + 1}. </span>
                  {step.title}
                </p>
                <p className="type-small text-text-secondary">{step.question}</p>
                <div className="flex flex-wrap gap-2">
                  {step.guideRef.map((sectionId) => (
                    <GuideChip key={sectionId} sectionId={sectionId} />
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </Expandable>
      )}

      {training.quiz && (
        <Expandable
          defaultOpen={expanded}
          showLabel="Show all questions"
          hideLabel="Hide questions"
          title={
            <div className="flex flex-col items-start gap-2">
              <Tag tone="blue">Quiz</Tag>
              <h2 className="type-item-title">
                Quiz: <span className="tabular-nums">{questionCountLabel(questions.length)}</span>
              </h2>
              <p className="type-small text-text-secondary">
                From {training.sections.join(", ")}. Session setup offers 10, 20 or 30 of them.
              </p>
            </div>
          }
        >
          <ol className="flex flex-col divide-y divide-border">
            {questions.map((question, index) => (
              <li key={question.id} className="flex flex-col gap-2 py-3">
                <p>
                  <span className="text-text-secondary tabular-nums">{index + 1}. </span>
                  {question.question}
                </p>
                <div>
                  <GuideChip sectionId={question.section} />
                </div>
              </li>
            ))}
          </ol>
        </Expandable>
      )}

      <ActionBar>
        <Button onClick={onStart}>Start training</Button>
        <ButtonLink href={`/materials/${material.id}`} variant="secondary">
          Back to material
        </ButtonLink>
      </ActionBar>
    </div>
  );
}
