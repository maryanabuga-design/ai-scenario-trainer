"use client";

import Link from "next/link";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { StatusChip } from "@/components/StatusChip/StatusChip";
import type { ScoredItem } from "@/lib/scoring";
import { analysisOrder, groupByErrorType, plainErrorLabel, weakItems } from "@/lib/scoring";

/**
 * Error types, in detail: the answers grouped by error type under plain labels ("Sure, but
 * wrong"), the most serious first. Each answer shows the situation or question practised and opens
 * its Answer review. Repeat is offered only when something is weak.
 */
export function AnalysisView({
  items,
  quiz,
  backHref,
  onRepeat,
}: {
  items: ScoredItem[];
  quiz: boolean;
  backHref: string;
  onRepeat: (ids: string[]) => void;
}) {
  const repeatIds = weakItems(items).map((item) => item.id);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-4">
        <CircleBackButton href={backHref} label="Back to results" />
        <h1 className="type-page-title">Error types</h1>
      </div>
      {groupByErrorType(items, analysisOrder).map((group) => (
        <section
          key={group.type}
          aria-labelledby={`analysis-${group.type}`}
          className="flex flex-col gap-3"
        >
          <h2 id={`analysis-${group.type}`} className="flex flex-wrap items-center gap-2">
            <StatusChip status={group.type} />
            <span className="type-body-strong">{plainErrorLabel[group.type]}</span>
            <span className="type-small text-text-secondary tabular-nums">
              {group.items.length} {group.items.length === 1 ? "answer" : "answers"}
            </span>
          </h2>
          <ol className="flex flex-col gap-3">
            {group.items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/session/results/review/${items.indexOf(item) + 1}?from=details`}
                  className="flex min-h-14 items-center gap-3 rounded-card bg-soft-card px-4 py-3 shadow-(--soft-shadow)"
                >
                  <span className="type-body line-clamp-2 min-w-0 flex-1">{item.prompt}</span>
                  <Chevron />
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
      {repeatIds.length > 0 && (
        <ActionBar>
          <Button onClick={() => onRepeat(repeatIds)}>
            {quiz ? "Repeat weak questions" : "Repeat weak topics"}
          </Button>
        </ActionBar>
      )}
    </div>
  );
}
