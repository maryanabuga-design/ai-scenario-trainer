"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ButtonLink } from "@/components/Button/Button";
import { ExamView } from "@/components/ExamView/ExamView";
import { byDeadline, nearestExam, useExams } from "@/lib/assigned-exams";
import type { AssignedExam } from "@/lib/assigned-exams";
import { isActive } from "@/lib/group-exams";
import { useGroupExams } from "@/lib/group-store";
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
  const groupExams = useGroupExams();
  const [now] = useState(() => Date.now());
  if (exams === "loading" || history === "loading" || groupExams === "loading") return null;
  // an exam assigned by the instructor (the Instructor side): its topics, its question count
  const group = groupExams.find((entry) => entry.id === params.get("id"));
  if (group && !isActive(group, now)) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="type-page-title">This exam is closed</h1>
        <p className="text-text-secondary">{group.title} can no longer be started.</p>
        <ButtonLink href="/" variant="secondary">
          Back to Home
        </ButtonLink>
      </div>
    );
  }
  const exam: AssignedExam | undefined =
    (group && {
      id: group.id,
      title: group.title,
      topicIds: group.topicIds,
      deadline: group.deadline,
      assignedBy: group.createdBy,
      assignedAt: group.createdAt,
    }) ||
    byDeadline(exams).find((entry) => entry.id === params.get("id")) ||
    nearestExam(exams) ||
    undefined;
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
        startExam(
          Date.now(),
          Math.random,
          group && { id: group.id, topicIds: group.topicIds, questionCount: group.questionCount },
        );
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
