"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  StudentDetailView,
  StudentNotFound,
} from "@/components/InstructorStudents/StudentDetailView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { useAuth } from "@/lib/auth";
import { participants } from "@/lib/cohort";
import { useAttempts, useGroupExams } from "@/lib/group-store";
import { readHistories } from "@/lib/student-data";
import type { Participant } from "@/lib/cohort";
import type { Reminder } from "@/lib/reminders";
import { reminderFor, reminderNoticeId, sentLine, unfinishedExam } from "@/lib/reminders";
import { addNotice } from "@/lib/group-store";
import { examRowsFor, filterFrom, originFrom, profiles, topicFrom } from "@/lib/students";

/** A local student account gets the reminder in Notifications; one per student and kind, sending again updates it. */
function sendReminderNotice(person: Participant, reminder: Reminder) {
  if (!person.local) return;
  addNotice({
    id: reminderNoticeId(person.id, reminder.kind),
    title: reminder.text,
    text: "",
    target: reminder.target,
    createdAt: Date.now(),
    to: person.id,
  });
}

function Detail() {
  const params = useParams<{ id: string }>();
  const query = useSearchParams();
  const auth = useAuth();
  const exams = useGroupExams();
  const attempts = useAttempts();
  const { sections } = useSourceSheet();
  const [now] = useState(() => Date.now());
  const [sent, setSent] = useState("");
  if (auth === "loading" || exams === "loading" || attempts === "loading") return null;

  const id = decodeURIComponent(params.id);
  const people = participants(auth.accounts);
  const person = people.find((entry) => entry.id === id);
  if (!person) return <StudentNotFound />;

  const profile = profiles([person], readHistories(auth.accounts))[0];
  const titleOf = (topic: string) => sections.find((s) => s.id === topic)?.title ?? topic;

  // Back: to the Exam detail when opened from there, otherwise to the list with its filter
  const fromExam = query.get("from") === "exam" ? query.get("exam") : null;
  const filter = filterFrom(query.get("filter"));
  const fromOverview = query.get("from") === "overview";
  const topic = topicFrom(query.get("topic"));
  const origin = originFrom(query.get("origin"));
  const listParams = new URLSearchParams();
  if (filter !== "all") listParams.set("filter", filter);
  if (topic) listParams.set("topic", topic);
  if (origin) listParams.set("from", origin);
  const listHref = listParams.toString()
    ? `/instructor/students?${listParams.toString()}`
    : "/instructor/students";
  const backHref = fromOverview
    ? "/instructor"
    : fromExam
      ? `/instructor/exams/${fromExam}`
      : listHref;
  const backLabel = fromOverview
    ? "Back to Overview"
    : fromExam
      ? "Back to exam"
      : "Back to students";

  const reminder = reminderFor(profile, unfinishedExam(person, exams, attempts, now), titleOf);

  return (
    <StudentDetailView
      profile={profile}
      reminder={reminder.text}
      sentMessage={sent}
      onSendReminder={() => {
        sendReminderNotice(person, reminder);
        setSent(sentLine(person.name));
      }}
      backHref={backHref}
      backLabel={backLabel}
      rows={examRowsFor(person, exams, attempts, now)}
      titleOf={titleOf}
      certificateHref={(row) =>
        row.certificateId
          ? `/instructor/students/${encodeURIComponent(person.id)}/certificate/${row.exam.id}`
          : null
      }
    />
  );
}

export default function StudentDetailPage() {
  return (
    <Suspense fallback={null}>
      <Detail />
    </Suspense>
  );
}
