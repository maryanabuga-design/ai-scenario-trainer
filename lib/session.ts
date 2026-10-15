import { findItem } from "@/lib/items";
import { clearPartRecords, recordPartResult } from "@/lib/part-progress";
import { createStore } from "@/lib/store";
import { clearTrainings } from "@/lib/trainings";

export type SessionKind = "scenario" | "quiz" | "repeat";

/** The option chosen for one step or question. */
export type Answer = {
  itemId: string;
  optionId: string;
  /** The hint of this question was opened (for the admin progress later). */
  hintUsed?: boolean;
};

/** A session: scenario, quiz and repeat round are all a list of questions with one chosen option each. */
export type Session = {
  kind: SessionKind;
  /** Set for a scenario session. */
  scenarioId?: string;
  /** The steps or questions in the order they are practised. */
  itemIds: string[];
  answers: Answer[];
  /** The question on screen. Answers are saved as they are given. */
  index: number;
  /** The Training part this session plays (`<mode>:<section>:<n>`); absent for other sessions. */
  partId?: string;
  /** Where Back on Results goes: where the session was started from. Home when absent. */
  returnTo?: string;
  /** Questions whose hint was opened; it moves onto the answer once there is one. */
  hintsOpened?: string[];
  finished: boolean;
  /** Set on Finish; ties the session to its entry in the history. */
  finishedAt?: number;
};

export type FinishedSession = Pick<
  Session,
  "kind" | "scenarioId" | "itemIds" | "answers" | "partId"
> & {
  finishedAt: number;
};

export type Profile = {
  direction: string;
  onboarded: boolean;
};

const sessionStore = createStore<Session>("ast.session.v1");
const historyStore = createStore<FinishedSession[]>("ast.history.v1");
const profileStore = createStore<Profile>("ast.profile.v1", { versioned: false });

export const useSession = sessionStore.useValue;
export const useHistory = historyStore.useValue;
export const useProfile = profileStore.useValue;

/** A saved session that has the shape this version expects; anything else is not used. */
export function isValidSession(value: unknown): value is Session {
  const session = value as Session | null;
  return (
    !!session &&
    typeof session === "object" &&
    Array.isArray(session.itemIds) &&
    Array.isArray(session.answers) &&
    typeof session.index === "number" &&
    typeof session.finished === "boolean" &&
    session.itemIds.every((id) => findItem(id) !== undefined)
  );
}

export function sessionLabel(session: Pick<Session, "kind">) {
  return { scenario: "Scenario", quiz: "Quiz", repeat: "Repeat round" }[session.kind];
}

export function saveSession(session: Session) {
  sessionStore.write(session);
}

export function startSession(
  kind: SessionKind,
  itemIds: string[],
  options: { scenarioId?: string; partId?: string; returnTo?: string } = {},
) {
  saveSession({
    kind,
    ...(options.scenarioId && { scenarioId: options.scenarioId }),
    ...(options.partId && { partId: options.partId }),
    ...(options.returnTo && { returnTo: options.returnTo }),
    itemIds,
    answers: [],
    index: 0,
    finished: false,
  });
}

/** The saved answer to one step or question, if it has one. */
export function answerFor(session: Pick<Session, "answers">, itemId: string): Answer | undefined {
  return session.answers.find((answer) => answer.itemId === itemId);
}

/** Saves the chosen option for one item, replacing an earlier choice and keeping hintUsed. */
export function withAnswer<T extends Pick<Session, "answers" | "hintsOpened">>(
  session: T,
  itemId: string,
  optionId: string,
): T {
  const before = answerFor(session, itemId);
  const hintUsed = before?.hintUsed || session.hintsOpened?.includes(itemId);
  const others = session.answers.filter((answer) => answer.itemId !== itemId);
  return { ...session, answers: [...others, { itemId, optionId, ...(hintUsed && { hintUsed }) }] };
}

/** Records that the hint of a question was opened, on its answer now or when it gets one. */
export function withHintUsed<T extends Pick<Session, "answers" | "hintsOpened">>(
  session: T,
  itemId: string,
): T {
  const opened = [...new Set([...(session.hintsOpened ?? []), itemId])];
  return {
    ...session,
    hintsOpened: opened,
    answers: session.answers.map((answer) =>
      answer.itemId === itemId ? { ...answer, hintUsed: true } : answer,
    ),
  };
}

/** Position of the first item without an answer, or -1 when every item is answered. */
export function firstUnanswered(session: Pick<Session, "itemIds" | "answers">): number {
  return session.itemIds.findIndex((id) => !answerFor(session, id));
}

/** Marks the session finished and adds it to the history used by Home and Progress. */
export function finishSession(session: Session) {
  const finishedAt = Date.now();
  const ordered = session.itemIds.flatMap((id) => answerFor(session, id) ?? []);
  saveSession({ ...session, answers: ordered, finished: true, finishedAt });
  const entry: FinishedSession = {
    kind: session.kind,
    ...(session.scenarioId && { scenarioId: session.scenarioId }),
    ...(session.partId && { partId: session.partId }),
    itemIds: session.itemIds,
    answers: ordered,
    finishedAt,
  };
  historyStore.write([...(historyStore.read() ?? []), entry]);
  recordPartResult({ partId: session.partId, answers: ordered });
}

export function saveProfile(profile: Profile) {
  profileStore.write(profile);
}

/** Deletes sessions, history, weak topics and created trainings. Direction, onboarding and uploads stay. */
export function resetProgress() {
  sessionStore.write(null);
  historyStore.write(null);
  clearPartRecords();
  clearTrainings();
}
