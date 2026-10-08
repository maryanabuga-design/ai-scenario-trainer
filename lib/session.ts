import type { Confidence, SessionMode } from "@/lib/scenario";
import { createStore } from "@/lib/store";

export type Answer = {
  stepId: string;
  optionId: string;
  confidence: Confidence;
  explanation: string;
};

export type Session = {
  mode: SessionMode;
  stepIds: string[];
  index: number;
  phase: "decide" | "feedback";
  answers: Answer[];
  finished: boolean;
};

export type FinishedSession = {
  mode: SessionMode;
  answers: Answer[];
  finishedAt: number;
};

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

export function saveSession(session: Session) {
  sessionStore.write(session);
}

export function startSession(mode: SessionMode, stepIds: string[]) {
  saveSession({ mode, stepIds, index: 0, phase: "decide", answers: [], finished: false });
}

/** Marks the session finished and adds it to the history used by Home and Progress. */
export function finishSession(session: Session) {
  saveSession({ ...session, finished: true });
  const history = historyStore.read() ?? [];
  historyStore.write([
    ...history,
    { mode: session.mode, answers: session.answers, finishedAt: Date.now() },
  ]);
}

export function saveProfile(profile: Profile) {
  profileStore.write(profile);
}

/** Deletes sessions, history and weak topics. Direction and onboarding stay. */
export function resetProgress() {
  sessionStore.write(null);
  historyStore.write(null);
}
