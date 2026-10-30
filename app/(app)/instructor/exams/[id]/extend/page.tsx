"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ExamNotFound } from "@/components/InstructorExams/ExamDetailView";
import { ExtendDeadlineView } from "@/components/InstructorExams/ExtendDeadlineView";
import { setFlash } from "@/lib/flash";
import { isActive, shortDate } from "@/lib/group-exams";
import { addNotice, extendGroupExam, useGroupExams } from "@/lib/group-store";

export default function ExtendDeadlinePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const exams = useGroupExams();
  const [now] = useState(() => Date.now());
  if (exams === "loading") return null;
  const exam = exams.find((entry) => entry.id === params.id);
  // only an active exam can be extended
  if (!exam || !isActive(exam, now)) return <ExamNotFound />;
  return (
    <ExtendDeadlineView
      exam={exam}
      now={now}
      onCancel={() => router.push(`/instructor/exams/${exam.id}`)}
      onExtend={(deadline) => {
        extendGroupExam(exam.id, deadline);
        // students are told once per new date
        addNotice({
          id: `extended-${exam.id}-${deadline}`,
          title: `Deadline extended: ${exam.title}`,
          text: `The new deadline is ${shortDate(deadline)}.`,
          target: `/exam?id=${exam.id}`,
          createdAt: Date.now(),
          groups: exam.groupIds,
        });
        setFlash("Deadline extended", `/instructor/exams/${exam.id}`);
        router.push(`/instructor/exams/${exam.id}`);
      }}
    />
  );
}
