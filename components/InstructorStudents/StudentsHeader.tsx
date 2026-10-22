"use client";

import { GroupSwitcher } from "@/components/GroupSwitcher/GroupSwitcher";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { ProfileAvatar } from "@/components/ProfileAvatar/ProfileAvatar";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import type { Scope } from "@/lib/groups";
import type { SwitcherRow } from "@/lib/overview";

export type StudentsView = "students" | "topics";

export const viewFrom = (value: string | null): StudentsView =>
  value === "topics" ? "topics" : "students";

const views: { value: StudentsView; label: string }[] = [
  { value: "students", label: "Students" },
  { value: "topics", label: "Topics" },
];

/**
 * The top of the Students tab (DESIGN.md: Instructor, Students rebuilt): the sand band with the
 * title, the small group switcher on the same row and the avatar at the right, and under it the
 * segmented switch "Students | Topics". A list opened from the Overview or Topics has Back in the band.
 */
export function StudentsHeader({
  scope,
  rows,
  onScope,
  switcherOpen = false,
  view,
  onView,
  back,
}: {
  scope: Scope;
  /** The rows of the group dropdown. */
  rows: SwitcherRow[];
  onScope: (scope: Scope) => void;
  /** For the review page: the dropdown drawn open. */
  switcherOpen?: boolean;
  view: StudentsView;
  onView: (view: StudentsView) => void;
  back?: { label: string; href: string };
}) {
  return (
    <>
      <PageHeaderBand
        title="Students"
        titleAccessory={
          <GroupSwitcher
            scope={scope}
            rows={rows}
            onSelect={onScope}
            compact
            initiallyOpen={switcherOpen}
          />
        }
        back={back}
        action={<ProfileAvatar />}
      />
      <SegmentedControl
        name="students-view"
        legend="View"
        hideLegend
        options={views}
        value={view}
        onChange={onView}
      />
    </>
  );
}
