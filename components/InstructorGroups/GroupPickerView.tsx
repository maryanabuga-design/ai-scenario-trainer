"use client";

import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { SelectableRow } from "@/components/SelectableRow/SelectableRow";
import { DEMO_NOTE } from "@/lib/cohort";
import { ALL_GROUPS, groups } from "@/lib/groups";
import { studentsCount } from "@/lib/overview";
import type { Scope } from "@/lib/groups";

/** Where the picker was opened from, so choosing returns there (`?from=overview|students|exams`). */
export type PickerOrigin = "overview" | "students" | "exams";

const origins: Record<PickerOrigin, { label: string; href: string }> = {
  overview: { label: "Back to Overview", href: "/instructor" },
  students: { label: "Back to Students", href: "/instructor/students" },
  exams: { label: "Back to Exams", href: "/instructor/exams" },
};

export const originOf = (value: string | null): PickerOrigin =>
  value === "students" || value === "exams" ? value : "overview";

export const originBack = (origin: PickerOrigin) => origins[origin];

/**
 * The group picker (DESIGN.md: Instructor, scope): a full screen with Back, the band "Groups" and
 * single-choice SelectableRows, "All groups" first. Choosing applies at once and returns.
 */
export function GroupPickerView({
  scope,
  counts,
  origin,
  onChoose,
}: {
  scope: Scope;
  /** The number of students of each group id. */
  counts: Record<string, number>;
  origin: PickerOrigin;
  onChoose: (scope: Scope) => void;
}) {
  const total = groups.reduce((sum, group) => sum + (counts[group.id] ?? 0), 0);
  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title="Groups"
        subtitle="Choose which group to look at"
        back={origins[origin]}
      />
      <fieldset role="radiogroup" aria-label="Group" className="flex flex-col gap-2">
        <SelectableRow
          name="group"
          value={ALL_GROUPS}
          tall
          checked={scope === ALL_GROUPS}
          onChange={() => onChoose(ALL_GROUPS)}
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="type-body-strong truncate">All groups</span>
            <span className="type-small truncate text-text-secondary">
              {groups.length} groups · {studentsCount(total)}
            </span>
          </span>
        </SelectableRow>
        {groups.map((group) => (
          <SelectableRow
            key={group.id}
            name="group"
            value={group.id}
            tall
            checked={scope === group.id}
            onChange={() => onChoose(group.id)}
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="type-body-strong truncate">{group.name}</span>
              <span className="type-small truncate text-text-secondary">
                {studentsCount(counts[group.id] ?? 0)}
              </span>
            </span>
          </SelectableRow>
        ))}
      </fieldset>
      <p data-demo-note className="type-small text-center text-text-secondary">
        {DEMO_NOTE}
      </p>
    </div>
  );
}
