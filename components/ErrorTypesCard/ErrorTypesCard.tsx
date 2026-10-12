import { ArrowRight } from "lucide-react";
import { Card } from "@/components/Card/Card";
import { StatusIcon, statuses } from "@/components/StatusBadge/StatusBadge";
import { errorTypeSummary } from "@/lib/scoring";
import type { ErrorType, TypeSummaryRow } from "@/lib/scoring";

/** The tile uses the chip's tint and icon colour; the chip's own size and padding are dropped. */
const tiles: Record<ErrorType, string> = {
  secure: "bg-secure-bg text-secure",
  guess: "border border-border bg-surface-muted text-text-secondary",
  knowledge_gap: "bg-caution-bg text-caution",
  misconception: "bg-misconception-bg text-misconception",
};

/** One error type: tile, name and description, count. Not a button. */
function TypeSummary({ row }: { row: TypeSummaryRow }) {
  return (
    <li className="flex items-center gap-3 rounded-panel bg-bg p-3">
      <span className="sr-only">{row.accessibleName}</span>
      <span
        aria-hidden="true"
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tiles[row.type]}`}
      >
        <StatusIcon status={row.type} size={20} />
      </span>
      <span aria-hidden="true" className="flex min-w-0 flex-1 flex-col">
        <span className={row.muted ? "text-text-secondary" : "font-medium text-text"}>
          {statuses[row.type].label}
        </span>
        <span className="text-sm text-text-secondary">{row.description}</span>
      </span>
      <span
        aria-hidden="true"
        className={`flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface px-2 text-sm font-medium tabular-nums ${
          row.muted ? "text-text-secondary" : "text-text"
        }`}
      >
        {row.count}
      </span>
    </li>
  );
}

/**
 * The Error types card: four type summary rows in the fixed order, always all four. Used on
 * results; it can also sum all saved sessions on Progress. detailsHref links to the analysis
 * grouped by error type.
 */
export function ErrorTypesCard({
  counts,
  detailsHref,
}: {
  counts: Record<ErrorType, number>;
  detailsHref?: string;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 id="error-types-title" className="text-lg font-medium">
          Error types
        </h2>
        {detailsHref && (
          <a
            href={detailsHref}
            className="-mr-2 inline-flex min-h-11 items-center gap-1 px-2 text-base text-text underline decoration-1 underline-offset-4 hover:decoration-2"
          >
            Details
            <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
          </a>
        )}
      </div>
      <ul aria-labelledby="error-types-title" className="flex flex-col gap-2">
        {errorTypeSummary(counts).map((row) => (
          <TypeSummary key={row.type} row={row} />
        ))}
      </ul>
    </Card>
  );
}
