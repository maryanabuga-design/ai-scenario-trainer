import { getQuestion } from "@/lib/quiz";
import type { SessionMode } from "@/lib/scenario";
import type { ScoredItem } from "@/lib/scoring";
import type { Session } from "@/lib/session";
import { isQuiz, isRepeatRound, startQuiz, startRepeatRound, startSession } from "@/lib/session";

/** Which session the results belong to. */
export type ResultsKind =
  | { kind: "scenario"; mode: SessionMode; scenarioId?: string }
  | { kind: "quiz"; mode: "quiz" | "repeat" }
  | { kind: "repeat" };

export function resultsKind(session: Session): ResultsKind {
  if (isRepeatRound(session)) return { kind: "repeat" };
  if (isQuiz(session)) return { kind: "quiz", mode: session.mode };
  return { kind: "scenario", mode: session.mode, scenarioId: session.scenarioId };
}

/** Starts a new round on the given weak answers of a finished session. */
export function startRepeat(session: Session, items: ScoredItem[], ids: string[]) {
  if (isRepeatRound(session)) {
    const again = items.filter((item) => ids.includes(item.id));
    startRepeatRound(
      again.map((item) => ({ type: item.kind, id: item.id })),
      [...new Set(again.flatMap((item) => item.sources))],
    );
  } else if (isQuiz(session)) {
    startQuiz(ids, [...new Set(ids.map((id) => getQuestion(id).section))], true);
  } else {
    startSession("repeat", ids, session.scenarioId);
  }
}
