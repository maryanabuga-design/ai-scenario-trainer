"use client";

import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { ProfileAvatar } from "@/components/ProfileAvatar/ProfileAvatar";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";

export type StudentsView = "students" | "topics";

export const viewFrom = (value: string | null): StudentsView =>
  value === "topics" ? "topics" : "students";

export const STUDENTS_SUBTITLE = "See how each student is doing and who needs your attention.";

const views: { value: StudentsView; label: string }[] = [
  { value: "students", label: "Students" },
  { value: "topics", label: "Topics" },
];

/**
 * The top of the Students tab (DESIGN.md: Students screen redesigned): the sand band with the title,
 * the muted subtitle and the avatar at the right (no group chip: the group is chosen on the
 * Overview), and under it the segmented switch "Students | Topics". A list opened from the Overview
 * or Topics has Back in the band.
 */
export function StudentsHeader({
  view,
  onView,
  back,
}: {
  view: StudentsView;
  onView: (view: StudentsView) => void;
  back?: { label: string; href: string };
}) {
  return (
    <>
      <PageHeaderBand
        title="Students"
        subtitle={<span className="text-text-secondary">{STUDENTS_SUBTITLE}</span>}
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
