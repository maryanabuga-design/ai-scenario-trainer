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
import { examRowsFor, filterFrom, profiles } from "@/lib/students";

function Detail() {
  const params = useParams<{ id: string }>();
  const query = useSearchParams();
  const auth = useAuth();
  const exams = useGroupExams();
  const attempts = useAttempts();
  const { sections } = useSourceSheet();
  const [now] = useState(() => Date.now());
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
  const backHref = fromExam
    ? `/instructor/exams/${fromExam}`
    : filter === "all"
      ? "/instructor/students"
      : `/instructor/students?filter=${filter}`;
  const backLabel = fromExam ? "Back to exam" : "Back to students";

  return (
    <StudentDetailView
      profile={profile}
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
