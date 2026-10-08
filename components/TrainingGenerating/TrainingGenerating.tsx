"use client";

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
      <div className="-ml-3">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-full px-3 text-base underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          Cancel
        </button>
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-2xl">Creating your training</h1>
        <p className="text-sm text-text-secondary">
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
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
        >
          <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-sm tabular-nums">{percent}%</p>
      </div>

      <ol className="flex flex-col divide-y divide-border rounded-card bg-surface px-4">
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
                className={`inline-flex shrink-0 items-center gap-1.5 text-sm ${
                  state === "done" ? "font-medium text-correct" : "text-text-secondary"
                }`}
              >
                {state === "done" && <StatusIcon status="correct" size={14} />}
                {state === "working" && <StatusIcon status="processing" size={14} />}
                {state === "waiting" && (
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-3.5 rounded-full border border-text-secondary"
                  />
                )}
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
