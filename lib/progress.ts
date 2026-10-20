import { findItem } from "@/lib/items";
import { currentWeakItems, scoreItem } from "@/lib/scoring";
import type { ScoredItem } from "@/lib/scoring";
import type { FinishedSession, Session } from "@/lib/session";

/** Every answer of a session, graded, in the order of the session's questions. An answer to a removed question is skipped. */
export function scoreSession(session: Pick<Session, "answers"> | FinishedSession): ScoredItem[] {
  return session.answers.flatMap((answer) => {
    const item = findItem(answer.itemId);
    return item ? [scoreItem(item, answer.optionId)] : [];
  });
}

/** Weak steps and questions across all finished sessions, oldest session first. */
export function weakItemsFromHistory(history: FinishedSession[] | null): ScoredItem[] {
  const all = [...(history ?? [])]
    .sort((a, b) => a.finishedAt - b.finishedAt)
    .flatMap(scoreSession)
    // questions of a published instructor set are practice only: never a weak topic
    .filter((scored) => !findItem(scored.id)?.imported);
  return currentWeakItems(all);
}
