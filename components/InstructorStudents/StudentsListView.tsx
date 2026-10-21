"use client";

import { Button, ButtonLink } from "@/components/Button/Button";
import { StudentLine, StudentListRow } from "@/components/InstructorStudents/StudentRow";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { ProfileAvatar } from "@/components/ProfileAvatar/ProfileAvatar";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { DEMO_NOTE, GROUP_NAME } from "@/lib/cohort";
import { filters, groupLine } from "@/lib/students";
import type { FilterOrigin, StudentProfile, StudentsFilter } from "@/lib/students";

export const NO_MATCH = "No students match this filter.";

/** The address of a student detail opened from the list, so Back returns to the same filter (topic, origin). */
export const studentHref = (
  id: string,
  filter: StudentsFilter,
  topic: string | null = null,
  origin: FilterOrigin | null = null,
) =>
  `/instructor/students/${encodeURIComponent(id)}?from=students&filter=${filter}${topic ? `&topic=${topic}` : ""}${origin ? `&origin=${origin}` : ""}`;

const backFor = (origin: FilterOrigin) =>
  origin === "topics"
    ? { label: "Back to Topics", href: "/instructor/topics" }
    : { label: "Back to Overview", href: "/instructor" };

/**
 * The Students tab of the Instructor (DESIGN.md: Instructor, Students): the band with the group line
 * and the avatar, the Primary "Invite students", the segmented selector (All, Attention, Certified)
 * and the student rows of a fixed 72px sorted by status. A filter from a tile or Topics shows its
 * one-line label ("Showing: Not started") with a Secondary "Clear filter", and the band's Back goes
 * to where the list was opened from.
 */
export function StudentsListView({
  shown,
  count,
  notStarted = 0,
  filter,
  showing = null,
  origin = null,
  onFilter,
  onClear,
  topic = null,
}: {
  /** The rows to show: already filtered and sorted. */
  shown: StudentProfile[];
  /** All the participants. */
  count: number;
  /** How many of them have not answered anything yet. */
  notStarted?: number;
  filter: StudentsFilter;
  /** The label of the filter that came from a tile or Topics, or null while none is shown. */
  showing?: string | null;
  /** Where the filtered list was opened from. */
  origin?: FilterOrigin | null;
  onFilter: (filter: StudentsFilter) => void;
  /** "Clear filter": back to the full list. */
  onClear?: () => void;
  /** The topic of the filter (kept in the links to a student). */
  topic?: string | null;
}) {
  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title="Students"
        subtitle={groupLine(GROUP_NAME, count, notStarted)}
        back={origin ? backFor(origin) : undefined}
        action={<ProfileAvatar />}
      />
      <ButtonLink href="/instructor/students/invite">Invite students</ButtonLink>
      <SegmentedControl
        name="students-filter"
        legend="Show"
        hideLegend
        options={filters}
        value={filters.some((f) => f.value === filter) ? filter : null}
        onChange={onFilter}
      />
      {showing && (
        <div className="flex flex-col gap-3">
          <p data-showing className="type-small text-text-secondary">
            {showing}
          </p>
          <Button variant="secondary" onClick={onClear}>
            Clear filter
          </Button>
        </div>
      )}
      {shown.length === 0 ? (
        <div className="flex flex-col gap-4">
          <p data-empty className="text-text-secondary">
            {NO_MATCH}
          </p>
          {!showing && (
            <Button variant="secondary" onClick={onClear}>
              Clear filter
            </Button>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((profile) => (
            <li key={profile.participant.id}>
              <StudentListRow
                id={profile.participant.id}
                href={studentHref(profile.participant.id, filter, topic, origin)}
                name={profile.participant.name}
                initials={profile.participant.initials}
                second={<StudentLine profile={profile} />}
              />
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
