import type { Response } from "@/lib/quiz";
import type { Confidence, SessionMode } from "@/lib/scenario";
import { createStore } from "@/lib/store";

export type Answer = {
  stepId: string;
  optionId: string;
  confidence: Confidence;
  explanation: string;
};

export type QuizAnswer = {
  questionId: string;
  response: Response;
  confidence: Confidence | null;
};

type Progress = {
  index: number;
  phase: "decide" | "feedback";
  finished: boolean;
};

/** Sessions saved before quizzes existed have no kind; they are scenario sessions. */
export type ScenarioSession = Progress & {
  kind?: "scenario";
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

export type Session = ScenarioSession | QuizSession;

export type FinishedSession =
  | { kind?: "scenario"; mode: SessionMode; answers: Answer[]; finishedAt: number }
  | { kind: "quiz"; mode: "quiz" | "repeat"; answers: QuizAnswer[]; finishedAt: number };

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

export function itemCount(session: Session) {
  return isQuiz(session) ? session.questionIds.length : session.stepIds.length;
}

export function saveSession(session: Session) {
  sessionStore.write(session);
}

export function startSession(mode: SessionMode, stepIds: string[]) {
  saveSession({ mode, stepIds, index: 0, phase: "decide", answers: [], finished: false });
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

/** Marks the session finished and adds it to the history used by Home and Progress. */
export function finishSession(session: Session) {
  saveSession({ ...session, finished: true });
  const finishedAt = Date.now();
  const entry: FinishedSession = isQuiz(session)
    ? { kind: "quiz", mode: session.mode, answers: session.answers, finishedAt }
    : { mode: session.mode, answers: session.answers, finishedAt };
  historyStore.write([...(historyStore.read() ?? []), entry]);
}

export function saveProfile(profile: Profile) {
  profileStore.write(profile);
}

/** Deletes sessions, history and weak topics. Direction and onboarding stay. */
export function resetProgress() {
  sessionStore.write(null);
  historyStore.write(null);
}
