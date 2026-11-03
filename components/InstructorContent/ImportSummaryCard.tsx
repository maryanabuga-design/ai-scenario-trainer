import {
  BookOpen,
  Layers,
  Link as ChainLink,
  MessageCircleQuestion,
  MountainSnow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IconTile } from "@/components/IconTile/IconTile";

export type ImportCounts = { guide: number; steps: number; scenario: number; questions: number };

const rows: { label: string; key: keyof ImportCounts; icon: LucideIcon }[] = [
  { label: "Guide sections", key: "guide", icon: BookOpen },
  { label: "Steps", key: "steps", icon: Layers },
  { label: "Scenario steps", key: "scenario", icon: MountainSnow },
  { label: "Questions", key: "questions", icon: MessageCircleQuestion },
];

const rowClass =
  "relative flex min-h-14 items-center gap-3 py-2 [&:not(:first-child)]:before:absolute [&:not(:first-child)]:before:top-0 [&:not(:first-child)]:before:right-0 [&:not(:first-child)]:before:left-[52px] [&:not(:first-child)]:before:h-px [&:not(:first-child)]:before:bg-selectable-stroke [&:not(:first-child)]:before:content-['']";

/**
 * The summary of an imported draft (DESIGN.md: Import summary card with icon rows): a full-width
 * white card, one row per count with the shared icon tile, the label and the value as plain
 * semi-bold text, rows divided by hairlines that start after the tile. The last row says whether
 * every item points to a guide section.
 */
export function ImportSummaryCard({
  counts,
  linkProblems,
}: {
  counts: ImportCounts;
  linkProblems: number;
}) {
  return (
    <div
      data-summary
      className="mt-1 w-full rounded-[16px] border border-selectable-stroke bg-card px-3 text-left"
    >
      <dl data-counts className="flex flex-col">
        {rows.map(({ label, key, icon: Icon }) => (
          <div key={label} className={rowClass}>
            <IconTile size="compact">
              <Icon strokeWidth={2} />
            </IconTile>
            <dt className="type-body min-w-0 flex-1 text-text-secondary">{label}</dt>
            <dd className="type-body-strong shrink-0 text-right tabular-nums">{counts[key]}</dd>
          </div>
        ))}
        <div data-links-row className={rowClass}>
          <IconTile size="compact">
            <ChainLink strokeWidth={2} />
          </IconTile>
          <dt className="type-body min-w-0 flex-1 text-text-secondary">Links to the guide</dt>
          <dd
            className={`type-body-strong shrink-0 text-right ${
              linkProblems === 0 ? "text-status-success-ink" : "text-status-attention-ink"
            }`}
          >
            {linkProblems === 0 ? "All linked" : `${linkProblems} need attention`}
          </dd>
        </div>
      </dl>
    </div>
  );
}
