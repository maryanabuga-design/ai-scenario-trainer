"use client";

import { useRouter } from "next/navigation";
import { NoResults } from "@/components/NoResults/NoResults";
import { ResultsView } from "@/components/ResultsView/ResultsView";
import { nearestExam, useExams } from "@/lib/assigned-exams";
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

  if (
    exam === "loading" ||
    history === "loading" ||
    exams === "loading" ||
    certificates === "loading"
  )
    return null;
  if (!exam || !exam.finished || !isValidExam(exam)) return <NoResults />;

  const topics = weakTopics(weakItemsFromHistory(history));
  const assigned = nearestExam(exams);
  const examHref = assigned ? examPath(assigned.id) : "/exam";
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
      onRepeat={() => {
        // the weak questions of the assigned exam; without one, the plain repeat of the weak topics
        if (!assigned || !startWeakSession(assigned, history)) return;
        window.scrollTo(0, 0);
        router.push("/session");
      }}
    />
  );
}
