"use client";

import { Funnel, UserPlus, UserRoundSearch } from "lucide-react";
import type { ReactNode } from "react";
import { Button, ButtonLink } from "@/components/Button/Button";
import { FilterChips } from "@/components/FilterChips/FilterChips";
import { GetStartedCard } from "@/components/InstructorOverview/OverviewBlocks";
import { StudentRow, StudentRowsCard } from "@/components/InstructorStudents/StudentRow";
import { SearchField } from "@/components/SearchField/SearchField";
import { DEMO_NOTE } from "@/lib/cohort";
import { getStarted } from "@/lib/get-started";
import { profileStatus, filters, isChipFilter, rowMuted } from "@/lib/students";
import type { FilterOrigin, StudentProfile, StudentsFilter } from "@/lib/students";

export const NO_SEARCH_MATCH = "No students match this search.";
export const NO_FILTER_MATCH = "No students match this filter.";

/** The address of a student detail opened from the list, so Back returns to the same filter (topic, origin). */
export const studentHref = (
  id: string,
  filter: StudentsFilter,
  topic: string | null = null,
  origin: FilterOrigin | null = null,
) =>
  `/instructor/students/${encodeURIComponent(id)}?from=students&filter=${filter}${topic ? `&topic=${topic}` : ""}${origin ? `&origin=${origin}` : ""}`;

/** The muted 44px filter line: a funnel, the words and an underlined "Clear filter". */
export function FilterLine({ text, onClear }: { text: string; onClear: () => void }) {
  return (
    <div
      data-filter-line
      className="flex min-h-11 items-center gap-2 rounded-[14px] bg-secondary-sand pr-1 pl-3"
    >
      <Funnel
        size={16}
        strokeWidth={2}
        aria-hidden="true"
        className="shrink-0 text-text-secondary"
      />
      <p data-showing className="type-small min-w-0 flex-1 truncate">
        {text}
      </p>
      <Button variant="tertiary" onClick={onClear}>
        Clear filter
      </Button>
    </div>
  );
}

/** A white card with an icon, a title, a muted line and a Secondary action (the empty states). */
export function EmptyCard({
  title,
  text,
  action,
  dataEmpty,
}: {
  title: string;
  text: string;
  action: ReactNode;
  dataEmpty: string;
}) {
  return (
    <div
      data-empty={dataEmpty}
      className="flex flex-col items-center gap-3 rounded-card border border-selectable-stroke bg-card p-[var(--gutter,1rem)] text-center shadow-(--card-shadow)"
    >
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-neutral-tile-bg text-neutral-tile-ink"
      >
        <UserRoundSearch size={28} strokeWidth={1.75} />
      </span>
      <h2 className="type-item-title">{title}</h2>
      <p className="type-body text-text-secondary">{text}</p>
      <div className="w-full">{action}</div>
    </div>
  );
}

/**
 * The Students view of the tab (DESIGN.md: Instructor, Students rebuilt): the Primary "Invite
 * students" (24px under the switch), the search field and the filter chips as ONE group (24px under the button, 12px between them), the filter line when the list comes filtered from
 * elsewhere, then ONE card of rows (or an empty state) and the demo note.
 */
export function StudentsListView({
  shown,
  total,
  filter,
  query,
  showing = null,
  origin = null,
  topic = null,
  onFilter,
  onQuery,
  onClearFilter,
}: {
  /** The rows to show: already searched, filtered and sorted. */
  shown: StudentProfile[];
  /** How many students the group has (0: an empty group). */
  total: number;
  filter: StudentsFilter;
  query: string;
  /** The text of the filter line, or null while none is shown. */
  showing?: string | null;
  origin?: FilterOrigin | null;
  topic?: string | null;
  onFilter: (filter: StudentsFilter) => void;
  onQuery: (query: string) => void;
  onClearFilter: () => void;
}) {
  return (
    <>
      {/* 24px under the switch (16px gap + 8px), then 24px under the button, grouping by spacing */}
      <div className="mt-2 flex flex-col gap-6">
        <ButtonLink href="/instructor/students/invite" icon={UserPlus}>
          Invite students
        </ButtonLink>
        <div data-search-group className="flex flex-col gap-3">
          <SearchField
            label="Search students"
            placeholder="Search students"
            value={query}
            onChange={onQuery}
          />
          <FilterChips
            name="students-filter"
            legend="Show"
            options={filters}
            value={isChipFilter(filter) ? filter : null}
            onChange={onFilter}
          />
        </div>
      </div>
      {showing && <FilterLine text={showing} onClear={onClearFilter} />}
      {total === 0 ? (
        <GetStartedCard
          steps={getStarted({ students: 0, exams: 0, publishedSets: 0 })!.slice(0, 1)}
        />
      ) : shown.length === 0 ? (
        query.trim() !== "" ? (
          <EmptyCard
            dataEmpty="search"
            title={NO_SEARCH_MATCH}
            text="Try another name or clear the filters."
            action={
              <Button variant="secondary" onClick={() => onQuery("")}>
                Clear search
              </Button>
            }
          />
        ) : (
          <EmptyCard
            dataEmpty="filter"
            title={NO_FILTER_MATCH}
            text="Try another filter."
            action={
              <Button variant="secondary" onClick={onClearFilter}>
                Clear filter
              </Button>
            }
          />
        )
      ) : (
        <StudentRowsCard>
          {shown.map((profile) => (
            <StudentRow
              key={profile.participant.id}
              id={profile.participant.id}
              href={studentHref(profile.participant.id, filter, topic, origin)}
              name={profile.participant.name}
              initials={profile.participant.initials}
              status={profileStatus(profile)}
              muted={rowMuted(profile)}
              demo={profile.participant.local}
            />
          ))}
        </StudentRowsCard>
      )}
      <p data-demo-note className="type-small text-center text-text-secondary">
        {DEMO_NOTE}
      </p>
    </>
  );
}
