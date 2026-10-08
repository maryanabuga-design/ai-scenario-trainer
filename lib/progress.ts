import { getStep } from "@/lib/scenario";
import type { SessionMode } from "@/lib/scenario";
import { currentWeakAnswers, scoreAnswer } from "@/lib/scoring";
import type { ScoredAnswer } from "@/lib/scoring";
import type { FinishedSession } from "@/lib/session";

export const modeLabels: Record<SessionMode, string> = {
  short: "Short session",
  full: "Full session",
  repeat: "Repeat session",
};

export function scoreSession(session: Pick<FinishedSession, "answers">): ScoredAnswer[] {
  return session.answers.map((answer) =>
    scoreAnswer(getStep(answer.stepId), answer.optionId, answer.confidence),
  );
}

/** Weak answers across all finished sessions, oldest session first. */
export function weakAnswersFromHistory(history: FinishedSession[] | null): ScoredAnswer[] {
  return currentWeakAnswers((history ?? []).flatMap(scoreSession));
}
