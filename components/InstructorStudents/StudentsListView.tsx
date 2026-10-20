"use client";

import Link from "next/link";
import { Button } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { StatusText } from "@/components/InstructorStudents/StatusText";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { DEMO_NOTE, GROUP_NAME } from "@/lib/cohort";
import { filters, groupLine, readinessOf, reviewLine, studentStatus } from "@/lib/students";
import type { StudentProfile, StudentsFilter } from "@/lib/students";

export const NO_MATCH = "No students match this filter.";

/** The address of a student detail opened from the list, so Back returns to the same filter. */
export const studentHref = (id: string, filter: StudentsFilter) =>
  `/instructor/students/${encodeURIComponent(id)}?from=students&filter=${filter}`;

/**
 * The Students tab of the Instructor (DESIGN.md: Instructor, Students): the band with the group line,
 * the segmented selector, and rows of a fixed 72px sorted by status. Read-only.
 */
export function StudentsListView({
  shown,
  count,
  filter,
  onFilter,
}: {
  /** The rows to show: already filtered and sorted. */
  shown: StudentProfile[];
  /** All the participants. */
  count: number;
  filter: StudentsFilter;
  onFilter: (filter: StudentsFilter) => void;
}) {
  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand title="Students" subtitle={groupLine(GROUP_NAME, count)} />
      <SegmentedControl
        name="students-filter"
        legend="Show"
        hideLegend
        options={filters}
        value={filter}
        onChange={onFilter}
      />
      {shown.length === 0 ? (
        <div className="flex flex-col gap-4">
          <p data-empty className="text-text-secondary">
            {NO_MATCH}
          </p>
          <Button variant="secondary" onClick={() => onFilter("all")}>
            Show all
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((profile) => (
            <li key={profile.participant.id}>
              <Link
                href={studentHref(profile.participant.id, filter)}
                data-student={profile.participant.id}
                className="flex h-[72px] items-center gap-3 rounded-card bg-card px-4 shadow-(--card-shadow) has-focus-visible:outline-2"
              >
                <span
                  aria-hidden="true"
                  className="type-body-strong flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-olive-tint text-primary"
                >
                  {profile.participant.initials}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="type-body-strong truncate">
                    {profile.participant.name}
                    {profile.participant.local && (
                      <span className="type-small font-normal text-text-secondary">
                        {" "}
                        · Your demo account
                      </span>
                    )}
                  </span>
                  <span className="type-small truncate text-text-secondary">
                    {reviewLine(profile)}
                  </span>
                </span>
                <span className="flex w-[84px] shrink-0 flex-col">
                  <StatusText status={studentStatus(readinessOf(profile))} wrap />
                </span>
                <Chevron />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p data-demo-note className="type-small text-center text-text-secondary">
        {DEMO_NOTE}
      </p>
    </div>
  );
}
