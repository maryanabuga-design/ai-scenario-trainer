import { Check } from "lucide-react";

/** Share answered correctly as a ring: a check inside when all are right, else the number. */
function Ring({ correct, total }: { correct: number; total: number }) {
  const radius = 41;
  const length = 2 * Math.PI * radius;
  const share = total === 0 ? 0 : correct / total;
  const all = total > 0 && correct === total;
  return (
    <div
      role="img"
      aria-label={`${correct} of ${total} correct`}
      className="relative h-22 w-22 shrink-0"
    >
      <svg viewBox="0 0 88 88" aria-hidden="true" className="h-full w-full -rotate-90">
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          strokeWidth="6"
          className="stroke-secondary-olive"
        />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${share * length} ${length}`}
          className="stroke-ring"
        />
      </svg>
      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
        {all ? (
          <Check size={32} strokeWidth={2} className="text-ring" />
        ) : (
          <span className="type-card-title text-text tabular-nums">{correct}</span>
        )}
      </span>
    </div>
  );
}

/** The card under the Results header: ring, title and one sentence. */
export function ProgressCard({
  correct,
  total,
  sentence,
  points,
}: {
  correct: number;
  total: number;
  sentence: string;
  points?: string;
}) {
  return (
    <section
      aria-labelledby="progress-title"
      className="relative -mt-8 flex flex-col rounded-card bg-soft-card p-5 shadow-(--soft-shadow)"
    >
      <div className="flex items-center gap-4">
        <Ring correct={correct} total={total} />
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="progress-title" className="type-card-title tabular-nums">
            {correct}/{total} correct
          </h2>
          <p className="type-small text-text-secondary">{sentence}</p>
          {points && <p className="type-small text-text-secondary tabular-nums">{points}</p>}
        </div>
      </div>
    </section>
  );
}
