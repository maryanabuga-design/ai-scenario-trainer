"use client";

import { useRouter } from "next/navigation";
import { NoResults } from "@/components/NoResults/NoResults";
import { ResultsView } from "@/components/ResultsView/ResultsView";
import { isValidExam, useExam } from "@/lib/exam-store";
import { scoreExam } from "@/lib/exam-session";
import { weakItemsFromHistory } from "@/lib/progress";
import { startRepeat } from "@/lib/repeat";
import { useHistory } from "@/lib/session";
import { weakTopics } from "@/lib/weak-topics";

export default function ExamResultsPage() {
  const router = useRouter();
  const exam = useExam();
  const history = useHistory();

  if (exam === "loading" || history === "loading") return null;
  if (!exam || !exam.finished || !isValidExam(exam)) return <NoResults />;

  const topics = weakTopics(weakItemsFromHistory(history));

  return (
    <ResultsView
      kind="exam"
      items={scoreExam(exam)}
      topics={topics}
      backHref="/exam"
      backLabel="Back to Exam"
      reviewHref="/exam/results/review/1"
      onRepeat={() => {
        startRepeat(topics);
        window.scrollTo(0, 0);
        router.push("/session");
      }}
    />
  );
}
