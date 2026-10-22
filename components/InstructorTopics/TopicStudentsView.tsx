import { FilePlus } from "lucide-react";
import { ButtonLink } from "@/components/Button/Button";
import { FilterLine } from "@/components/InstructorStudents/StudentsListView";
import { StudentRow, StudentRowsCard } from "@/components/InstructorStudents/StudentRow";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { assignOnTopic, TopicBadge } from "@/components/InstructorTopics/TopicsView";
import { DEMO_NOTE } from "@/lib/cohort";
import { PASS_MARK } from "@/lib/config";
import type { TopicStanding } from "@/lib/overview";
import { profileStatus, topicMuted } from "@/lib/students";
import type { StudentProfile } from "@/lib/students";

/**
 * The students below the pass mark in one topic (DESIGN.md: Instructor, Students rebuilt): Back to
 * Topics, the sand summary card, the filter line "Below pass mark in S3" with Clear filter, the
 * label with the count, the student rows ("· S3: 2 of 5 correct"), the Secondary "Assign exam on
 * this topic" and the demo note.
 */
export function TopicStudentsView({
  id,
  title,
  standing,
  rows,
  onClear,
}: {
  id: string;
  title: string;
  standing: TopicStanding;
  /** The students below the pass mark in this topic, sorted. */
  rows: StudentProfile[];
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title={title}
        back={{ label: "Back to Topics", href: "/instructor/students?view=topics" }}
      />
      <div
        data-topic-summary
        className="flex items-center gap-3 rounded-card border border-selectable-stroke bg-secondary-sand p-[var(--gutter,1rem)]"
      >
        <TopicBadge id={id} />
        <div className="flex min-w-0 flex-col">
          <p className="type-body-strong truncate">{title}</p>
          <p className="type-small text-text-secondary">
            Pass mark: {PASS_MARK} · {standing.passing} of {standing.total} students on track
          </p>
        </div>
      </div>
      <FilterLine text={`Below pass mark in ${id}`} onClear={onClear} />
      <h2 className="type-label text-text-secondary">
        {rows.length} {rows.length === 1 ? "STUDENT" : "STUDENTS"} BELOW PASS MARK
      </h2>
      <StudentRowsCard>
        {rows.map((profile) => (
          <StudentRow
            key={profile.participant.id}
            id={profile.participant.id}
            href={`/instructor/students/${encodeURIComponent(profile.participant.id)}?from=students&topic=${id}&origin=topics`}
            name={profile.participant.name}
            initials={profile.participant.initials}
            status={profileStatus(profile)}
            muted={topicMuted(profile, id)}
            demo={profile.participant.local}
            longMuted
          />
        ))}
      </StudentRowsCard>
      <ButtonLink href={assignOnTopic(id)} variant="secondary" icon={FilePlus}>
        Assign exam on this topic
      </ButtonLink>
      <p data-demo-note className="type-small text-center text-text-secondary">
        {DEMO_NOTE}
      </p>
    </div>
  );
}
