"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ExamDetailView, ExamNotFound } from "@/components/InstructorExams/ExamDetailView";
import type { DetailDialog } from "@/components/InstructorExams/ExamDetailView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { useAuth } from "@/lib/auth";
import { groupCounts, participants, studentRows } from "@/lib/cohort";
import { hardestQuestions } from "@/lib/exam-detail";
import { isActive, shortDate } from "@/lib/group-exams";
import { examPeople } from "@/lib/groups";
import { addNotice, closeGroupExam, useAttempts, useGroupExams } from "@/lib/group-store";
import { studentsCount } from "@/lib/overview";

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
  const [dialog, setDialog] = useState<DetailDialog>(null);
  if (exams === "loading" || attempts === "loading" || auth === "loading") return null;

  const exam = exams.find((entry) => entry.id === params.id);
  if (!exam) return <ExamNotFound />;

  const people = examPeople(participants(auth.accounts), exam);
  const active = isActive(exam, now);
  const context = { attempts, now };
  const counts = groupCounts(people, exam, context);
  const titleOf = (id: string) => sections.find((section) => section.id === id)?.title ?? id;

  return (
    <ExamDetailView
      exam={exam}
      active={active}
      now={now}
      counts={counts}
      rows={studentRows(people, exam, context)}
      hardest={hardestQuestions(people, exam, attempts, now)}
      titleOf={titleOf}
      message={message}
      fromOverview={fromOverview}
      dialog={dialog}
      onAskRemind={() => setDialog("remind")}
      onRemind={() => {
        const at = Date.now();
        // one reminder per exam: sending again replaces the earlier one
        addNotice({
          id: `remind-${exam.id}`,
          title: `Reminder: ${exam.title} is due ${shortDate(exam.deadline)}`,
          text: "You have not started this exam yet.",
          target: `/exam?id=${exam.id}`,
          createdAt: at,
          groups: exam.groupIds,
        });
        setDialog(null);
        setMessage(`Reminder sent to ${studentsCount(counts.notStarted)}`);
      }}
      onAskClose={() => setDialog("close")}
      onCancelDialog={() => setDialog(null)}
      onClose={() => {
        closeGroupExam(exam.id);
        setDialog(null);
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
