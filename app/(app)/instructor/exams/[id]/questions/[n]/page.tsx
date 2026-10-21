"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { ExamNotFound } from "@/components/InstructorExams/ExamDetailView";
import { ExamQuestionView } from "@/components/InstructorExams/ExamQuestionView";
import { useAuth } from "@/lib/auth";
import { participants } from "@/lib/cohort";
import { examQuestionIds } from "@/lib/exam-pool";
import { hardestQuestions } from "@/lib/exam-detail";
import { examPeople } from "@/lib/groups";
import { useAttempts, useGroupExams } from "@/lib/group-store";
import { findItem } from "@/lib/items";

export default function ExamQuestionPage() {
  const params = useParams<{ id: string; n: string }>();
  const exams = useGroupExams();
  const attempts = useAttempts();
  const auth = useAuth();
  const [now] = useState(() => Date.now());
  if (exams === "loading" || attempts === "loading" || auth === "loading") return null;
  const exam = exams.find((entry) => entry.id === params.id);
  const number = Number(params.n);
  const id = exam && Number.isInteger(number) ? examQuestionIds(exam)[number - 1] : undefined;
  const item = id ? findItem(id) : undefined;
  if (!exam || !item) return <ExamNotFound />;
  const people = examPeople(participants(auth.accounts), exam);
  // the counts of this question (the hardest list is the only place that carries them)
  const stat = hardestQuestions(people, exam, attempts, now).find((q) => q.id === item.id) ?? null;
  return <ExamQuestionView item={item} number={number} stats={stat} examId={exam.id} />;
}
