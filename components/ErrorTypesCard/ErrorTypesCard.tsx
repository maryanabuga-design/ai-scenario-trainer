import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { SoftCard } from "@/components/SoftCard/SoftCard";
import { StatusIcon } from "@/components/StatusBadge/StatusBadge";
import { errorTypeSummary } from "@/lib/scoring";
import type { ErrorType, TypeSummaryRow } from "@/lib/scoring";

/** Row tint, the tile's tint and icon ink, and the count badge in the tile's tint. */
const tints: Record<ErrorType, { row: string; tile: string; ink: string }> = {
  secure: { row: "bg-secure-row", tile: "bg-secure-bg", ink: "text-secure" },
  guess: { row: "bg-guess-row", tile: "bg-guess-tile", ink: "text-guess-ink" },
  knowledge_gap: { row: "bg-gap-row", tile: "bg-caution-bg", ink: "text-caution" },
  misconception: {
    row: "bg-misconception-row",
    tile: "bg-misconception-bg",
    ink: "text-misconception",
  },
};

/** One error type: tile, name and description, count. Not a button. */
function TypeSummary({ row }: { row: TypeSummaryRow }) {
  const tint = tints[row.type];
  return (
    <li className={`flex items-center gap-3 rounded-[20px] p-3 ${tint.row}`}>
      <span className="sr-only">{row.accessibleName}</span>
      <span
        aria-hidden="true"
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tint.tile} ${tint.ink}`}
      >
        <StatusIcon status={row.type} size={20} />
      </span>
      <span aria-hidden="true" className="flex min-w-0 flex-1 flex-col">
        <span className="font-semibold text-text">{row.label}</span>
        <span className="text-sm text-text-secondary">{row.description}</span>
      </span>
      <span
        aria-hidden="true"
        className={`flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full px-2 text-sm font-medium tabular-nums ${tint.tile} text-text`}
      >
        {row.count}
      </span>
    </li>
  );
}

/**
 * The Error types card: four type summary rows in the fixed order, always all four. Used on
 * results; it can also sum all saved sessions on Progress. Details opens the Error analysis.
 */
export function ErrorTypesCard({
  counts,
  detailsHref,
  onNavigate,
}: {
  counts: Record<ErrorType, number>;
  detailsHref?: string;
  onNavigate?: () => void;
}) {
  return (
    <SoftCard
      title="Error types"
      titleId="error-types-title"
      subtitle="See what kind of mistakes you made"
      action={
        detailsHref && (
          <Link
            href={detailsHref}
            onClick={onNavigate}
            className="-my-3 -mr-2 inline-flex min-h-11 shrink-0 items-center gap-1.5 px-2 text-base text-text underline decoration-1 underline-offset-4 hover:decoration-2"
          >
            Details
            <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
          </Link>
        )
      }
    >
      <ul aria-labelledby="error-types-title" className="flex flex-col gap-2.5">
        {errorTypeSummary(counts).map((row) => (
          <TypeSummary key={row.type} row={row} />
        ))}
      </ul>
    </SoftCard>
  );
}
