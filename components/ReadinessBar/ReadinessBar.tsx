import { EXAM_PASS_MARK } from "@/lib/readiness";

/**
 * The readiness bar (DESIGN.md: Exam readiness): a track in `--olive-tint`, the fill in `--primary`
 * and a tick at the pass mark with its own text label, so the state is never shown by colour alone.
 * A progressbar with an accessible label. Used on the exam screen and on Progress.
 */
export function ReadinessBar({
  percent,
  passMark = EXAM_PASS_MARK,
  label = "Readiness",
}: {
  percent: number;
  passMark?: number;
  /** The accessible name: "Readiness 62%, pass mark 80%" is built from it. */
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div
        role="progressbar"
        aria-label={`${label} ${percent}%, pass mark ${passMark}%`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="relative h-3 rounded-full bg-olive-tint"
      >
        <div
          data-readiness-fill
          className="h-full rounded-full bg-primary"
          style={{ width: `${percent}%` }}
        />
        <span
          data-readiness-tick
          aria-hidden="true"
          className="absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 bg-text"
          style={{ left: `${passMark}%` }}
        />
      </div>
      <p aria-hidden="true" className="type-caption relative h-4 text-text-secondary">
        <span
          data-readiness-tick-label
          className="absolute -translate-x-1/2 whitespace-nowrap"
          style={{ left: `${passMark}%` }}
        >
          {passMark}%
        </span>
      </p>
    </div>
  );
}
