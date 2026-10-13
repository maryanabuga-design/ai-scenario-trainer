"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { SourceChip } from "@/components/SourceChip/SourceChip";
import { Tag } from "@/components/Tag/Tag";
import type { Material } from "@/lib/materials";
import { questionsFor } from "@/lib/quiz";
import { questionCountLabel } from "@/lib/quiz-setup";
import type { Question } from "@/lib/quiz";
import { defaultStory, getScenario } from "@/lib/scenario";
import type { Training } from "@/lib/training";

const typeLabels: Record<Question["type"], string> = {
  single: "Single choice",
  multiple: "Multiple choice",
  ordering: "Ordering",
  text: "Short text",
  truefalse: "True or false",
};

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
      <div>
        <Button
          variant="text"
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
  const steps = defaultStory(scenarioDef);
  const others = (["short", "extended"] as const)
    .filter((length) => length !== scenarioDef.defaultLength && scenarioDef.lengths[length])
    .map((length) => `${length} session of ${scenarioDef.lengths[length]?.stepIds.length}`);
  const questions = questionsFor(training.sections);
  const quizSize = Math.min(training.quizSize ?? questions.length, questions.length);

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
              <Tag>Scenario</Tag>
              <h2 className="type-item-title">
                Scenario: <span className="tabular-nums">{steps.length}</span> decisions
              </h2>
              <p className="type-small text-text-secondary">
                {scenarioDef.title}.{" "}
                {others.length > 0
                  ? `Also as a ${others.join(" or an ")}.`
                  : "This material has one length."}
              </p>
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
                  {step.sources.map((sectionId) => (
                    <SourceChip key={sectionId} sectionId={sectionId} />
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
              <Tag>Quiz</Tag>
              <h2 className="type-item-title">
                Quiz: <span className="tabular-nums">{questionCountLabel(quizSize)}</span>
              </h2>
              <p className="type-small text-text-secondary">
                Drawn from{" "}
                <span className="tabular-nums">{questionCountLabel(questions.length)}</span> in{" "}
                {training.sections.join(", ")}. Session setup offers up to {quizSize}.
              </p>
            </div>
          }
        >
          <ol className="flex flex-col divide-y divide-border">
            {questions.map((question, index) => (
              <li key={question.id} className="flex flex-col gap-2 py-3">
                <span className="type-label text-text-secondary">
                  {index + 1}. {typeLabels[question.type]}
                </span>
                <p>{question.question}</p>
                <div>
                  <SourceChip sectionId={question.section} />
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
