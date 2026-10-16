import { Clock } from "lucide-react";
import { formatClock, isTimeWarning } from "@/lib/exam";

/** What a screen reader hears about the time, only at a few moments so it is never chatty. */
function spoken(seconds: number): string {
  if (seconds === 120) return "2 minutes left";
  if (seconds === 60) return "1 minute left";
  if (seconds === 10) return "10 seconds left";
  return "";
}

/**
 * The exam countdown: a pill "mm:ss" with a clock icon, a card colour until the last 2 minutes and
 * a rose pastel after that.
 */
export function ExamTimer({ seconds }: { seconds: number }) {
  const warning = isTimeWarning(seconds);
  return (
    <>
      <span
        role="timer"
        aria-label={`Time left ${formatClock(seconds)}`}
        data-warning={warning}
        className={`type-small inline-flex h-8 items-center gap-1.5 rounded-full px-3 tabular-nums ${
          warning ? "bg-primary text-primary-text" : "bg-card text-text shadow-(--card-shadow)"
        }`}
      >
        <Clock size={16} strokeWidth={2} aria-hidden="true" />
        {formatClock(seconds)}
      </span>
      <span role="status" aria-live="polite" className="sr-only">
        {spoken(seconds)}
      </span>
    </>
  );
}
