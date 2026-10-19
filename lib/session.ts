import { findItem, sectionOrder } from "@/lib/items";
import { clearPartRecords, recordPartResult } from "@/lib/part-progress";
import { clearExam } from "@/lib/exam-store";
import { notifyFinished, resetNotifications } from "@/lib/notifications";
import { cleanHistory, cleanSession } from "@/lib/saved-data";
import { createStore } from "@/lib/store";
import { clearTrainings } from "@/lib/trainings";

export type SessionKind = "scenario" | "quiz" | "repeat" | "exam";

/** The option chosen for one step or question. */
export type Answer = {
  itemId: string;
  optionId: string;
  /** The hint of this question was opened (for the admin progress later). */
  hintUsed?: boolean;
  /** Training modes: the answer was checked, so it is locked and its feedback shows. */
  checked?: boolean;
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
  /** How it was started, for Progress: practice (a part, a topic, a repeat), a mini-quiz or the exam. */
  mode?: "practice" | "mini-quiz" | "exam";
  /** The Training part this session plays (`<mode>:<section>:<n>`); absent for other sessions. */
  partId?: string;
  /** Where Back on Results goes: where the session was started from. Home when absent. */
  returnTo?: string;
  /** An assigned exam this session practises ("Repeat weak topics"): its summary shows the readiness before and after. */
  examId?: string;
  /** The exam's readiness when the session started, in percent. */
  readinessBefore?: number;
  /** Questions whose hint was opened; it moves onto the answer once there is one. */
  hintsOpened?: string[];
  finished: boolean;
  /** Set on Finish; ties the session to its entry in the history. */
  finishedAt?: number;
};

export type FinishedSession = Pick<
  Session,
  "kind" | "scenarioId" | "itemIds" | "answers" | "partId" | "mode"
> & {
  finishedAt: number;
  /** The guide topics of its questions (Progress shows the name). Records saved before it have none. */
  topicIds?: string[];
  /** Only for an exam: its result, the number of questions and the time used. */
  exam?: ExamResult;
};

export type ExamResult = {
  percent: number;
  questions: number;
  timeUsedSeconds: number;
};

export type Profile = {
  direction: string;
  onboarded: boolean;
};

const sessionStore = createStore<Session>("ast.session.v1", { sanitize: cleanSession });
const historyStore = createStore<FinishedSession[]>("ast.history.v1", {
  sanitize: cleanHistory,
});
const profileStore = createStore<Profile>("ast.profile.v1", { versioned: false });

export const useSession = sessionStore.useValue;

/** The saved session and history, read from the browser (cleaned of removed questions). */
export const readSession = () => sessionStore.read();
export const readHistory = () => historyStore.read();
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
  return { scenario: "Scenario", quiz: "Quiz", repeat: "Repeat round", exam: "Exam" }[session.kind];
}

/** Where Leave on the Exit dialog goes: the reading screen or the exam screen the session was started from, else Home. */
export function leaveHref(session: Pick<Session, "returnTo">): string {
  const back = session.returnTo;
  return back?.startsWith("/materials/read/") ||
    back?.startsWith("/exam?id=") ||
    back === "/progress"
    ? back
    : "/";
}

export function saveSession(session: Session) {
  sessionStore.write(session);
}

export function startSession(
  kind: SessionKind,
  itemIds: string[],
  options: {
    scenarioId?: string;
    partId?: string;
    returnTo?: string;
    examId?: string;
    readinessBefore?: number;
    mode?: Session["mode"];
  } = {},
) {
  saveSession({
    kind,
    ...(options.mode && { mode: options.mode }),
    ...(options.scenarioId && { scenarioId: options.scenarioId }),
    ...(options.partId && { partId: options.partId }),
    ...(options.returnTo && { returnTo: options.returnTo }),
    ...(options.examId && { examId: options.examId }),
    ...(options.readinessBefore !== undefined && { readinessBefore: options.readinessBefore }),
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
  // A checked answer is locked.
  if (before?.checked) return session;
  const hintUsed = before?.hintUsed || session.hintsOpened?.includes(itemId);
  const others = session.answers.filter((answer) => answer.itemId !== itemId);
  return { ...session, answers: [...others, { itemId, optionId, ...(hintUsed && { hintUsed }) }] };
}

/** Locks the chosen answer of a question: it was checked, and its feedback shows from now on. */
export function withChecked<T extends Pick<Session, "answers">>(session: T, itemId: string): T {
  return {
    ...session,
    answers: session.answers.map((answer) =>
      answer.itemId === itemId ? { ...answer, checked: true } : answer,
    ),
  };
}

/** Whether a question counts as done: checked in the training modes, chosen in the exam. */
export function isDone(answer: Answer | undefined, mode: "training" | "exam"): boolean {
  if (!answer) return false;
  return mode === "exam" || answer.checked === true;
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

/** The guide topics of a list of questions, in guide order. */
export function topicIdsOf(itemIds: string[]): string[] {
  const sections = new Set(itemIds.flatMap((id) => findItem(id)?.section ?? []));
  return [...sections].sort((a, b) => sectionOrder(a) - sectionOrder(b));
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
    mode: session.mode ?? "practice",
    topicIds: topicIdsOf(session.itemIds),
    itemIds: session.itemIds,
    answers: ordered,
    finishedAt,
  };
  addToHistory(entry);
  recordPartResult({ partId: session.partId, answers: ordered });
}

/** Adds a finished session to the history used by Home, Progress and the weak topics. */
export function addToHistory(entry: FinishedSession) {
  const history = [...(historyStore.read() ?? []), entry];
  historyStore.write(history);
  notifyFinished(entry, history);
}

export function saveProfile(profile: Profile) {
  profileStore.write(profile);
}

/** Deletes sessions, history, weak topics and created trainings. Direction, onboarding and uploads stay. */
export function resetProgress() {
  sessionStore.write(null);
  clearExam();
  historyStore.write(null);
  clearPartRecords();
  clearTrainings();
  resetNotifications();
}
