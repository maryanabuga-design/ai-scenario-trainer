"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ExamDetailView, ExamNotFound } from "@/components/InstructorExams/ExamDetailView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { useAuth } from "@/lib/auth";
import { groupCounts, participants, studentRows } from "@/lib/cohort";
import { isActive, shortDate } from "@/lib/group-exams";
import { addNotice, closeGroupExam, useAttempts, useGroupExams } from "@/lib/group-store";

function Detail() {
  const params = useParams<{ id: string }>();
  const query = useSearchParams();
  const assigned = query.get("assigned") === "1";
  const fromOverview = query.get("from") === "overview";
  const exams = useGroupExams();
  const attempts = useAttempts();
  const auth = useAuth();
  const { sections } = useSourceSheet();
  const [now] = useState(() => Date.now());
  const [message, setMessage] = useState(
    assigned ? "Exam assigned. Students will see it on Home." : "",
  );
  const [confirming, setConfirming] = useState(false);
  if (exams === "loading" || attempts === "loading" || auth === "loading") return null;

  const exam = exams.find((entry) => entry.id === params.id);
  if (!exam) return <ExamNotFound />;

  const people = participants(auth.accounts);
  const active = isActive(exam, now);
  const context = { attempts, active };
  const counts = groupCounts(people, exam, context);
  const titleOf = (id: string) => sections.find((section) => section.id === id)?.title ?? id;

  return (
    <ExamDetailView
      exam={exam}
      active={active}
      counts={counts}
      rows={studentRows(people, exam, context)}
      titleOf={titleOf}
      message={message}
      fromOverview={fromOverview}
      confirmingClose={confirming}
      onRemind={() => {
        const at = Date.now();
        addNotice({
          id: `remind-${exam.id}`,
          title: `Reminder: ${exam.title} is due ${shortDate(exam.deadline)}`,
          text: "You have not started this exam yet.",
          target: `/exam?id=${exam.id}`,
          createdAt: at,
        });
        const n = counts.notStarted;
        setMessage(`Reminder sent to ${n} ${n === 1 ? "student" : "students"}`);
      }}
      onAskClose={() => setConfirming(true)}
      onCancelClose={() => setConfirming(false)}
      onClose={() => {
        closeGroupExam(exam.id);
        setConfirming(false);
        setMessage("Exam closed.");
      }}
    />
  );
}

export default function ExamDetailPage() {
  return (
    <Suspense fallback={null}>
      <Detail />
    </Suspense>
  );
}
