"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ExamView } from "@/components/ExamView/ExamView";
import { byDeadline, nearestExam, useExams } from "@/lib/assigned-exams";
import { deadlineText } from "@/lib/exam-deadline";
import { examResults } from "@/lib/exam";
import { startExam } from "@/lib/exam-session";
import { examReadiness, hasWeakTopics } from "@/lib/readiness";
import { useHistory } from "@/lib/session";
import { startWeakSession } from "@/lib/weak-session";

function ExamScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const exams = useExams();
  const history = useHistory();
  if (exams === "loading" || history === "loading") return null;
  const exam =
    byDeadline(exams).find((entry) => entry.id === params.get("id")) ?? nearestExam(exams);
  // the demo exam is saved right after the first load
  if (!exam) return null;
  const { last, best } = examResults(history);
  const count = (attempt: typeof last) =>
    attempt && {
      correct: attempt.correct,
      questions: attempt.questions,
      finishedAt: attempt.finishedAt,
    };

  return (
    <ExamView
      title={exam.title}
      assignedBy={exam.assignedBy}
      deadline={deadlineText(exam.deadline, new Date())}
      readiness={examReadiness(exam.topicIds, history)}
      canRepeat={hasWeakTopics(exam.topicIds, history)}
      last={count(last)}
      best={count(best)}
      onStart={() => {
        startExam();
        window.scrollTo(0, 0);
        router.push("/exam/session");
      }}
      onRepeat={() => {
        if (!startWeakSession(exam, history)) return;
        window.scrollTo(0, 0);
        router.push("/session");
      }}
    />
  );
}

export default function ExamPage() {
  return (
    <Suspense fallback={null}>
      <ExamScreen />
    </Suspense>
  );
}
