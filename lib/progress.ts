import { explanationOutcome } from "@/lib/feedback";
import { getQuestion, scoreQuestion } from "@/lib/quiz";
import { getStep } from "@/lib/scenario";
import type { SessionMode } from "@/lib/scenario";
import { currentWeakItems, scoreStep } from "@/lib/scoring";
import type { ScoredItem } from "@/lib/scoring";
import type { Answer, FinishedSession, Session } from "@/lib/session";

export function sessionLabel(
  session:
    | { kind?: "scenario"; mode: SessionMode }
    | { kind: "quiz"; mode: "quiz" | "repeat" }
    | { kind: "repeat" },
) {
  if (session.kind === "repeat") return "Repeat round";
  if (session.kind === "quiz") return session.mode === "repeat" ? "Quiz repeat" : "Quiz";
  return {
    short: "Short session",
    full: "Full session",
    extended: "Extended session",
    repeat: "Repeat session",
  }[session.mode];
}

/** A saved scenario answer, with its explanation check and any "still correct" mark. */
function scoreAnswerStep(answer: Answer): ScoredItem {
  const step = getStep(answer.stepId);
  return scoreStep(step, answer.optionId, answer.confidence, {
    explanation: explanationOutcome(step, answer),
    markedCorrect: answer.markedCorrect,
  });
}

export function scoreSession(session: Session | FinishedSession): ScoredItem[] {
  if (session.kind === "repeat") {
    return session.answers.map((answer) =>
      answer.type === "question"
        ? scoreQuestion(
            getQuestion(answer.questionId),
            answer.response,
            answer.confidence,
            answer.markedCorrect,
          )
        : scoreAnswerStep(answer),
    );
  }
  if (session.kind === "quiz") {
    return session.answers.map((answer) =>
      scoreQuestion(
        getQuestion(answer.questionId),
        answer.response,
        answer.confidence,
        answer.markedCorrect,
      ),
    );
  }
  return session.answers.map((answer) => scoreAnswerStep(answer));
}

/** Weak steps and questions across all finished sessions, oldest session first. */
export function weakItemsFromHistory(history: FinishedSession[] | null): ScoredItem[] {
  return currentWeakItems((history ?? []).flatMap(scoreSession));
}

/** Formats points without trailing zeros: 7.5, 2, 0.67. */
export function formatPoints(points: number) {
  return String(Math.round(points * 100) / 100);
}
