"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProgressView } from "@/components/ProgressView/ProgressView";
import { nearestExam, useExams } from "@/lib/assigned-exams";
import { useExam } from "@/lib/exam-store";
import { usePractiseTopic } from "@/lib/use-practise";
import { resultHrefFor } from "@/lib/result-links";
import { allTopicIds } from "@/lib/progress-view";
import { weakSessionIds } from "@/lib/readiness";
import { startSession, useHistory, useSession } from "@/lib/session";
import { startWeakSession } from "@/lib/weak-session";
import type { AssignedExam } from "@/lib/assigned-exams";
import type { FinishedSession } from "@/lib/session";

/** Rendered once everything is read, so the time is never part of the prerender. */
function Loaded({ history, exam }: { history: FinishedSession[]; exam: AssignedExam | null }) {
  const router = useRouter();
  const session = useSession();
  const finishedExam = useExam();
  const practise = usePractiseTopic("/progress");
  const [now] = useState(() => new Date());
  const resultHref = resultHrefFor(session, finishedExam);

  return (
    <ProgressView
      history={history}
      exam={exam}
      now={now}
      resultHref={resultHref}
      onPractise={practise}
      onRepeat={() => {
        if (exam) {
          if (!startWeakSession(exam, history)) return;
        } else {
          const ids = weakSessionIds(allTopicIds, history);
          if (ids.length === 0) return;
          startSession("repeat", ids, { returnTo: "/progress" });
        }
        window.scrollTo(0, 0);
        router.push("/session");
      }}
    />
  );
}

export default function Progress() {
  const history = useHistory();
  const exams = useExams();
  if (history === "loading" || exams === "loading") return null;
  return <Loaded history={history ?? []} exam={nearestExam(exams)} />;
}
