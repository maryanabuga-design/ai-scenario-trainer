import type { ExamSession } from "@/lib/exam-store";
import type { FinishedSession, Session } from "@/lib/session";

/**
 * The results screen a finished session can still open. The app keeps the results of the latest
 * finished session (`/session/results`) and of the latest finished exam (`/exam/results`) only, so
 * every older session has no screen to open. CLIENT ONLY (it works on saved progress).
 */
export function resultHrefFor(
  session: Session | null | "loading",
  exam: ExamSession | null | "loading",
): (entry: FinishedSession) => string | null {
  return (entry) => {
    if (entry.kind === "exam") {
      return exam && exam !== "loading" && exam.finished && exam.finishedAt === entry.finishedAt
        ? "/exam/results"
        : null;
    }
    return session &&
      session !== "loading" &&
      session.finished &&
      session.finishedAt === entry.finishedAt
      ? "/session/results"
      : null;
  };
}
