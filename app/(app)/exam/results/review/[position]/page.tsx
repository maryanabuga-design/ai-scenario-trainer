"use client";

import { Suspense } from "react";
import { NoResults } from "@/components/NoResults/NoResults";
import { SessionReview } from "@/components/SessionReview/SessionReview";
import { isValidExam, useExam } from "@/lib/exam-store";

function Review() {
  const exam = useExam();
  if (exam === "loading") return null;
  if (!exam || !exam.finished || !isValidExam(exam)) return <NoResults />;
  return <SessionReview session={exam} base="/exam/results" backLabel="Back to results" />;
}

/** The Answer review of one question of the last finished exam. */
export default function ExamReviewPage() {
  return (
    <Suspense fallback={null}>
      <Review />
    </Suspense>
  );
}
