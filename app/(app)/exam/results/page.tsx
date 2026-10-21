"use client";

import { useRouter } from "next/navigation";
import { NoResults } from "@/components/NoResults/NoResults";
import { ResultsView } from "@/components/ResultsView/ResultsView";
import { nearestExam, useExams } from "@/lib/assigned-exams";
import { useCurrentAccount } from "@/lib/auth";
import { attemptsLeft } from "@/lib/cohort";
import { attemptsLeftLine } from "@/lib/exam-detail";
import { useAttempts, useGroupExams } from "@/lib/group-store";
import { useCertificates } from "@/lib/certificates-store";
import { isValidExam, useExam } from "@/lib/exam-store";
import { scoreExam } from "@/lib/exam-session";
import { weakItemsFromHistory } from "@/lib/progress";
import { useHistory } from "@/lib/session";
import { examPath, startWeakSession } from "@/lib/weak-session";
import { weakTopics } from "@/lib/weak-topics";

export default function ExamResultsPage() {
  const router = useRouter();
  const exam = useExam();
  const history = useHistory();
  const exams = useExams();
  const certificates = useCertificates();
  const groupExams = useGroupExams();
  const attempts = useAttempts();
  const account = useCurrentAccount();

  if (
    exam === "loading" ||
    history === "loading" ||
    exams === "loading" ||
    certificates === "loading" ||
    groupExams === "loading" ||
    attempts === "loading" ||
    account === "loading"
  )
    return null;
  if (!exam || !exam.finished || !isValidExam(exam)) return <NoResults />;

  const topics = weakTopics(weakItemsFromHistory(history));
  const assigned = nearestExam(exams);
  const group = exam.examId ? groupExams.find((entry) => entry.id === exam.examId) : undefined;
  const examHref = group ? `/exam?id=${group.id}` : assigned ? examPath(assigned.id) : "/exam";
  const left =
    group && account
      ? attemptsLeft(
          group,
          attempts.filter((a) => a.examId === group.id && a.studentId === account.email),
        )
      : undefined;
  const certificate = certificates.find((entry) => entry.attemptAt === exam.finishedAt);

  return (
    <ResultsView
      kind="exam"
      items={scoreExam(exam)}
      topics={topics}
      backHref={examHref}
      doneHref={examHref}
      backLabel="Back to Exam"
      reviewHref="/exam/results/review/1"
      certificateHref={certificate ? `/profile/certificates/${certificate.id}` : undefined}
      attemptsLine={
        left === undefined ? undefined : left === 0 ? "No attempts left" : attemptsLeftLine(left)
      }
      onRepeat={() => {
        // the weak questions of the assigned exam; without one, the plain repeat of the weak topics
        if (!assigned || !startWeakSession(assigned, history)) return;
        window.scrollTo(0, 0);
        router.push("/session");
      }}
    />
  );
}
