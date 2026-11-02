import { AssignIcon } from "@/components/AssignIcon/AssignIcon";
import { ButtonLink } from "@/components/Button/Button";
import {
  InitialsAvatar,
  StudentRow,
  StudentRowsCard,
} from "@/components/InstructorStudents/StudentRow";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { assignOnTopic } from "@/components/InstructorTopics/TopicsView";
import { PASS_MARK } from "@/lib/config";
import type { TopicStanding } from "@/lib/overview";
import { profileStatus, topicMuted } from "@/lib/students";
import type { StudentProfile } from "@/lib/students";

export const TOPIC_SUBTITLE = "Students below the pass mark on this topic.";

/**
 * The students below the pass mark in one topic (DESIGN.md: Students polish): Back to Topics, the
 * title (the topic name) with the muted subtitle, the white summary card (the topic code tile, "Topic
 * S4", "Pass mark: 80 · 8 of 13 students on track"), the label with the count, the student rows
 * ("· S3: 2 of 5 correct"), the Secondary "Assign exam on this topic" and the demo note. No filter strip.
 */
export function TopicStudentsView({
  id,
  title,
  standing,
  rows,
}: {
  id: string;
  title: string;
  standing: TopicStanding;
  /** The students below the pass mark in this topic, sorted. */
  rows: StudentProfile[];
}) {
  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title={title}
        subtitle={<span className="text-text-secondary">{TOPIC_SUBTITLE}</span>}
        back={{ label: "Back to Topics", href: "/instructor/students?view=topics" }}
      />
      <section
        data-topic-summary
        className="flex items-center gap-4 rounded-card border border-selectable-stroke bg-card p-[var(--gutter,1rem)] shadow-(--card-shadow)"
      >
        <InitialsAvatar initials={id} size={64} />
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="type-card-title truncate">Topic {id}</h2>
          <p className="type-small text-text-secondary">
            Pass mark: {PASS_MARK} · {standing.passing} of {standing.total} students on track
          </p>
        </div>
      </section>
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
          />
        ))}
      </StudentRowsCard>
      <ButtonLink href={assignOnTopic(id)} variant="secondary" icon={AssignIcon}>
        Assign exam on this topic
      </ButtonLink>
    </div>
  );
}
