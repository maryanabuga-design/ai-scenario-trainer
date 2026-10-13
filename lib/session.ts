import type { Response } from "@/lib/quiz";
import type { ExplanationCheck } from "@/lib/feedback";
import type { Confidence, SessionMode } from "@/lib/scenario";
import { createStore } from "@/lib/store";
import type { RepeatItem } from "@/lib/weak-topics";
import { clearTrainings } from "@/lib/trainings";

/** How an answer was given: typed text, "I don't know", or only a choice. */
export type AnswerSource = "typed" | "dont_know" | "choice";

export type Answer = {
  stepId: string;
  optionId: string;
  confidence: Confidence;
  /** The user's own sentence, a reflection that is never checked. Empty after "I don't know". */
  explanation: string;
  skipped?: boolean;
  /** A wrong choice the user marked correct ("My answer is still correct"). */
  markedCorrect?: boolean;
  answerSource?: AnswerSource;
  /** The simulated check of the typed explanation; worked out again for older answers. */
  explanationCheck?: ExplanationCheck;
};

export type QuizAnswer = {
  questionId: string;
  response: Response;
  confidence: Confidence | null;
  /** A wrong, partly right or rejected answer the user marked correct. */
  markedCorrect?: boolean;
  /** "I don't know" on a short text question: an empty answer, no confidence. */
  dontKnow?: boolean;
  answerSource?: AnswerSource;
};

type Progress = {
  index: number;
  /** Scenario steps go decide → explain → feedback; quiz questions skip explain. */
  phase: "decide" | "explain" | "feedback";
  finished: boolean;
};

/** Sessions saved before quizzes existed have no kind; they are scenario sessions. */
export type ScenarioSession = Progress & {
  kind?: "scenario";
  /** Missing in sessions saved before there were two scenarios: the evacuation one. */
  scenarioId?: string;
  mode: SessionMode;
  stepIds: string[];
  answers: Answer[];
};

export type QuizSession = Progress & {
  kind: "quiz";
  mode: "quiz" | "repeat";
  sections: string[];
  questionIds: string[];
  answers: QuizAnswer[];
};

/** One answer in a repeat round: a scenario step or a quiz question. */
export type MixedAnswer = ({ type: "step" } & Answer) | ({ type: "question" } & QuizAnswer);

/** A repeat round mixes the weak steps and questions of the chosen topics. */
export type RepeatSession = Progress & {
  kind: "repeat";
  topics: string[];
  items: RepeatItem[];
  answers: MixedAnswer[];
};

export type Session = ScenarioSession | QuizSession | RepeatSession;

export type FinishedSession =
  | {
      kind?: "scenario";
      scenarioId?: string;
      mode: SessionMode;
      answers: Answer[];
      finishedAt: number;
    }
  | { kind: "quiz"; mode: "quiz" | "repeat"; answers: QuizAnswer[]; finishedAt: number }
  | { kind: "repeat"; topics: string[]; answers: MixedAnswer[]; finishedAt: number };

export type Profile = {
  direction: string;
  onboarded: boolean;
};

const sessionStore = createStore<Session>("ast.session.v1");
const historyStore = createStore<FinishedSession[]>("ast.history.v1");
const profileStore = createStore<Profile>("ast.profile.v1");

export const useSession = sessionStore.useValue;
export const useHistory = historyStore.useValue;
export const useProfile = profileStore.useValue;

export function isQuiz(session: Session | FinishedSession): session is QuizSession {
  return session.kind === "quiz";
}

export function isRepeatRound(session: Session): session is RepeatSession {
  return session.kind === "repeat";
}

export function itemCount(session: Session) {
  if (isRepeatRound(session)) return session.items.length;
  return isQuiz(session) ? session.questionIds.length : session.stepIds.length;
}

export function saveSession(session: Session) {
  sessionStore.write(session);
}

export function startSession(mode: SessionMode, stepIds: string[], scenarioId?: string) {
  saveSession({
    scenarioId,
    mode,
    stepIds,
    index: 0,
    phase: "decide",
    answers: [],
    finished: false,
  });
}

export function startQuiz(questionIds: string[], sections: string[], repeat = false) {
  saveSession({
    kind: "quiz",
    mode: repeat ? "repeat" : "quiz",
    sections,
    questionIds,
    index: 0,
    phase: "decide",
    answers: [],
    finished: false,
  });
}

export function startRepeatRound(items: RepeatItem[], topics: string[]) {
  saveSession({
    kind: "repeat",
    topics,
    items,
    index: 0,
    phase: "decide",
    answers: [],
    finished: false,
  });
}

/** Marks the session finished and adds it to the history used by Home and Progress. */
export function finishSession(session: Session) {
  saveSession({ ...session, finished: true });
  const finishedAt = Date.now();
  const entry: FinishedSession = isRepeatRound(session)
    ? { kind: "repeat", topics: session.topics, answers: session.answers, finishedAt }
    : isQuiz(session)
      ? { kind: "quiz", mode: session.mode, answers: session.answers, finishedAt }
      : {
          scenarioId: session.scenarioId,
          mode: session.mode,
          answers: session.answers,
          finishedAt,
        };
  historyStore.write([...(historyStore.read() ?? []), entry]);
}

export function saveProfile(profile: Profile) {
  profileStore.write(profile);
}

/** Deletes sessions, history, weak topics and created trainings. Direction, onboarding and uploads stay. */
export function resetProgress() {
  sessionStore.write(null);
  historyStore.write(null);
  clearTrainings();
}

/**
 * "My answer is still correct" (marked true) and its Undo (false), on the answer to one step or
 * question. Saved with the session, so it survives a reload.
 */
export function setMarkedCorrect<T extends Session>(
  session: T,
  itemId: string,
  marked: boolean,
): T {
  const mark = <A extends Answer | QuizAnswer>(answer: A): A => {
    const next = { ...answer };
    delete next.markedCorrect;
    return marked ? { ...next, markedCorrect: true } : next;
  };
  const matches = (answer: Answer | QuizAnswer) =>
    "stepId" in answer ? answer.stepId === itemId : answer.questionId === itemId;
  if (isRepeatRound(session)) {
    return {
      ...session,
      answers: session.answers.map((answer) => (matches(answer) ? mark(answer) : answer)),
    };
  }
  if (isQuiz(session)) {
    return {
      ...session,
      answers: session.answers.map((answer) => (matches(answer) ? mark(answer) : answer)),
    };
  }
  return {
    ...session,
    answers: (session as ScenarioSession).answers.map((answer) =>
      matches(answer) ? mark(answer) : answer,
    ),
  };
}

/** The saved source, or for answers saved before it existed, worked out from the answer. */
export function answerSource(answer: Answer | QuizAnswer): AnswerSource {
  if (answer.answerSource) return answer.answerSource;
  if ("stepId" in answer) {
    if (answer.skipped) return "dont_know";
    return answer.explanation.trim() ? "typed" : "choice";
  }
  if (answer.dontKnow) return "dont_know";
  return answer.response.type === "text" && answer.response.text.trim() ? "typed" : "choice";
}
