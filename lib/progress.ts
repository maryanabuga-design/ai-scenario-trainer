import { getItem } from "@/lib/items";
import { currentWeakItems, scoreItem } from "@/lib/scoring";
import type { ScoredItem } from "@/lib/scoring";
import type { FinishedSession, Session } from "@/lib/session";

/** Every answer of a session, graded, in the order of the session's questions. */
export function scoreSession(session: Pick<Session, "answers"> | FinishedSession): ScoredItem[] {
  return session.answers.map((answer) => scoreItem(getItem(answer.itemId), answer.optionId));
}

/** Weak steps and questions across all finished sessions, oldest session first. */
export function weakItemsFromHistory(history: FinishedSession[] | null): ScoredItem[] {
  const all = [...(history ?? [])]
    .sort((a, b) => a.finishedAt - b.finishedAt)
    .flatMap(scoreSession);
  return currentWeakItems(all);
}
