"use client";

import { GroupPill } from "@/components/InstructorOverview/OverviewBlocks";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { ProfileAvatar } from "@/components/ProfileAvatar/ProfileAvatar";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import type { Scope } from "@/lib/groups";

export type StudentsView = "students" | "topics";

export const viewFrom = (value: string | null): StudentsView =>
  value === "topics" ? "topics" : "students";

const views: { value: StudentsView; label: string }[] = [
  { value: "students", label: "Students" },
  { value: "topics", label: "Topics" },
];

/**
 * The top of the Students tab (DESIGN.md: Instructor, Students rebuilt): the sand band with the
 * title, the small group pill on the same row and the avatar at the right, and under it the
 * segmented switch "Students | Topics". A list opened from the Overview or Topics has Back in the band.
 */
export function StudentsHeader({
  scope,
  view,
  onView,
  back,
}: {
  scope: Scope;
  view: StudentsView;
  onView: (view: StudentsView) => void;
  back?: { label: string; href: string };
}) {
  return (
    <>
      <PageHeaderBand
        title="Students"
        titleAccessory={<GroupPill scope={scope} from="students" compact />}
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
