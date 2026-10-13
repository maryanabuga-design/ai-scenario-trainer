"use client";

import { Button } from "@/components/Button/Button";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { Circle } from "lucide-react";
import { StatusIcon } from "@/components/StatusBadge/StatusBadge";

export type GenerationStep = { label: string; skipped?: boolean };

export function generationSteps(scenario: boolean): GenerationStep[] {
  return [
    { label: "Reading the material" },
    { label: "Finding key sections" },
    { label: "Writing situations", skipped: !scenario },
    { label: "Writing questions" },
  ];
}

/**
 * The simulated generation: four steps with a state each (icon and label), an overall progress
 * bar and Cancel. `active` is the index of the step being worked on; past steps are done.
 */
export function TrainingGenerating({
  steps,
  active,
  percent,
  onCancel,
}: {
  steps: GenerationStep[];
  active: number;
  percent: number;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <CircleBackButton label="Back to Create training" onClick={onCancel} />
        <div className="-mr-3">
          <Button variant="text" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="type-page-title">Creating your training</h1>
        <p className="type-small text-text-secondary">
          Generation is simulated for this prototype. Prepared content is shown.
        </p>
      </div>

      <div className="flex flex-col gap-2" role="status" aria-live="polite">
        <div
          role="progressbar"
          aria-label="Generation progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-1.5 w-full overflow-hidden rounded-full bg-secondary-olive"
        >
          <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
        <p className="type-small tabular-nums">{percent}%</p>
      </div>

      <ol className="flex flex-col divide-y divide-border rounded-card bg-card shadow-(--card-shadow) px-4">
        {steps.map((step, index) => {
          const state = step.skipped
            ? "skipped"
            : index < active
              ? "done"
              : index === active
                ? "working"
                : "waiting";
          return (
            <li key={step.label} className="flex min-h-14 items-center justify-between gap-3 py-3">
              <span
                className={state === "waiting" || state === "skipped" ? "text-text-secondary" : ""}
              >
                {step.label}
              </span>
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 type-small ${
                  state === "done" ? "text-correct" : "text-text-secondary"
                }`}
              >
                {state === "done" && <StatusIcon status="correct" size={14} />}
                {state === "working" && <StatusIcon status="processing" size={14} />}
                {state === "waiting" && <Circle size={14} strokeWidth={2} aria-hidden="true" />}
                {state === "skipped" && <StatusIcon status="knowledge_gap" size={14} />}
                {
                  { done: "Done", working: "Working", waiting: "Waiting", skipped: "Not needed" }[
                    state
                  ]
                }
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
