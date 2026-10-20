"use client";

import { useRouter } from "next/navigation";
import { NoResults } from "@/components/NoResults/NoResults";
import { ResultsView } from "@/components/ResultsView/ResultsView";
import { byDeadline, useExams } from "@/lib/assigned-exams";
import { scoreSession, weakItemsFromHistory } from "@/lib/progress";
import { startRepeat } from "@/lib/repeat";
import { isValidSession, useHistory, useSession } from "@/lib/session";
import { weakTopics } from "@/lib/weak-topics";

export default function ResultsPage() {
  const router = useRouter();
  const session = useSession();
  const history = useHistory();
  const exams = useExams();

  if (session === "loading" || history === "loading" || exams === "loading") return null;
  if (!session || !session.finished || !isValidSession(session)) return <NoResults />;

  const topics = weakTopics(weakItemsFromHistory(history));
  // a repeat session for an assigned exam: Done goes to the exam screen
  const exam = session.examId
    ? byDeadline(exams).find((entry) => entry.id === session.examId)
    : undefined;
  const examRepeat = exam !== undefined;

  return (
    <ResultsView
      kind={session.kind}
      items={scoreSession(session)}
      topics={topics}
      backHref={session.returnTo ?? "/"}
      backLabel={exam ? "Back to Exam" : undefined}
      examRepeat={examRepeat}
      doneHref={examRepeat ? session.returnTo : undefined}
      onRepeat={() => {
        startRepeat(topics);
        window.scrollTo(0, 0);
        router.push("/session");
      }}
    />
  );
}
