"use client";

import { useRouter } from "next/navigation";
import { ProgressView } from "@/components/ProgressView/ProgressView";
import { nearestExam, useExams } from "@/lib/assigned-exams";
import { useHistory } from "@/lib/session";
import { startWeakSession } from "@/lib/weak-session";

export default function Progress() {
  const router = useRouter();
  const history = useHistory();
  const exams = useExams();

  if (history === "loading" || exams === "loading") return null;
  const exam = nearestExam(exams);

  return (
    <ProgressView
      history={history ?? []}
      exam={exam}
      onRepeat={() => {
        if (!exam || !startWeakSession(exam, history)) return;
        window.scrollTo(0, 0);
        router.push("/session");
      }}
    />
  );
}
