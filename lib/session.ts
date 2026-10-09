import type { Response } from "@/lib/quiz";
import type { Confidence, SessionMode } from "@/lib/scenario";
import { createStore } from "@/lib/store";
import type { RepeatItem } from "@/lib/weak-topics";
import { clearTrainings } from "@/lib/trainings";

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
