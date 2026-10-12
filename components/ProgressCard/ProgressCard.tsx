import { Check, ChevronRight, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

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
          className="stroke-ring-track"
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
          <span className="text-xl font-semibold text-text tabular-nums">{correct}</span>
        )}
      </span>
    </div>
  );
}

const rowStyles = {
  correct: {
    label: "Correct",
    icon: Check,
    row: "bg-correct-row",
    tile: "bg-correct-tile",
    ink: "text-correct-ink",
  },
  incorrect: {
    label: "Incorrect",
    icon: X,
    row: "bg-wrong-row",
    tile: "bg-wrong-tile",
    ink: "text-wrong-ink",
  },
} satisfies Record<
  string,
  { label: string; icon: LucideIcon; row: string; tile: string; ink: string }
>;

/** A tinted Correct or Incorrect row. It opens the analysis filtered; with 0 it is plain. */
function ResultRow({
  kind,
  count,
  href,
  onNavigate,
}: {
  kind: keyof typeof rowStyles;
  count: number;
  href: string;
  onNavigate?: () => void;
}) {
  const style = rowStyles[kind];
  const Icon = style.icon;
  const content = (
    <>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.tile} ${style.ink}`}
      >
        <Icon size={20} strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="flex-1 text-2xl text-text tabular-nums">{count}</span>
      <span className={`text-xs font-medium tracking-[0.06em] uppercase ${style.ink}`}>
        {style.label}
      </span>
      {count > 0 && (
        <>
          <span className="sr-only">, show these answers</span>
          <ChevronRight size={20} strokeWidth={2} aria-hidden="true" className={style.ink} />
        </>
      )}
    </>
  );
  const className = `flex min-h-14 items-center gap-3 rounded-panel px-3 py-2 ${style.row}`;
  if (count === 0) {
    return <div className={className}>{content}</div>;
  }
  return (
    <Link href={href} onClick={onNavigate} className={`${className} active:brightness-95`}>
      {content}
    </Link>
  );
}

/** The card under the Results header: ring, title, one sentence, and the two result rows. */
export function ProgressCard({
  correct,
  total,
  sentence,
  points,
  analysisHref,
  onNavigate,
}: {
  correct: number;
  total: number;
  sentence: string;
  points?: string;
  analysisHref: string;
  onNavigate?: () => void;
}) {
  return (
    <section
      aria-labelledby="progress-title"
      className="relative -mt-8 flex flex-col gap-4 rounded-card bg-soft-card p-5 shadow-(--soft-shadow)"
    >
      <div className="flex items-center gap-4">
        <Ring correct={correct} total={total} />
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="progress-title" className="text-xl font-semibold tabular-nums">
            {correct}/{total} correct
          </h2>
          <p className="text-sm text-text-secondary">{sentence}</p>
          {points && <p className="text-sm text-text-secondary tabular-nums">{points}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <ResultRow
          kind="correct"
          count={correct}
          href={`${analysisHref}?show=correct`}
          onNavigate={onNavigate}
        />
        <ResultRow
          kind="incorrect"
          count={total - correct}
          href={`${analysisHref}?show=incorrect`}
          onNavigate={onNavigate}
        />
      </div>
    </section>
  );
}
