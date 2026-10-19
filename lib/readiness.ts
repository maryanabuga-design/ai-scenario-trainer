import { latestAnswers } from "@/lib/part-progress";
import { modeItems, trainingSections } from "@/lib/parts";
import { sectionOrder } from "@/lib/items";
import { PASS_MARK } from "@/lib/config";
import type { FinishedSession } from "@/lib/session";

/**
 * Exam readiness (DESIGN.md: Exam readiness). CLIENT ONLY by the server/client rule: it is about
 * progress, so server pages never import it. Everything here is pure: the history is a parameter.
 */

/** The pass mark of an assigned exam: the app's one pass mark. */
export const EXAM_PASS_MARK = PASS_MARK;

/** The most questions one "Repeat weak topics" session has. */
export const REPEAT_SESSION_QUESTIONS = 10;

/** The topics of an exam that exist in the guide, in guide order; unknown ids are ignored. */
export function knownTopics(topicIds: string[]): string[] {
  return trainingSections
    .filter((section) => topicIds.includes(section))
    .sort((a, b) => sectionOrder(a) - sectionOrder(b));
}

/** The exam's question pool: every training question (both modes) of its topics, in guide order. */
export function scopeItemIds(topicIds: string[]): string[] {
  const topics = new Set(knownTopics(topicIds));
  return [...modeItems("scenario"), ...modeItems("quiz")]
    .filter((item) => topics.has(item.section))
    .sort((a, b) => sectionOrder(a.section) - sectionOrder(b.section))
    .map((item) => item.id);
}

/** The latest result (true correct, false wrong) of every question answered in any finished session. */
export function latestResults(history: FinishedSession[] | null): Map<string, boolean> {
  return latestAnswers(history);
}

const wholePercent = (part: number, whole: number) =>
  whole === 0 ? 0 : Math.floor((part / whole) * 100 + 1e-9);

/** Readiness of a set of questions: those whose latest answer is correct over all of them, rounded down. */
export function readinessOver(ids: string[], history: FinishedSession[] | null): number {
  const latest = latestResults(history);
  return wholePercent(ids.filter((id) => latest.get(id) === true).length, ids.length);
}

/** Readiness for an exam: an unanswered question is not correct; an empty scope is 0. */
export function examReadiness(topicIds: string[], history: FinishedSession[] | null): number {
  return readinessOver(scopeItemIds(topicIds), history);
}

/** The exam's questions whose latest answer is wrong. */
export function mistakes(topicIds: string[], history: FinishedSession[] | null): string[] {
  const latest = latestResults(history);
  return scopeItemIds(topicIds).filter((id) => latest.get(id) === false);
}

/** The exam's questions that were never answered. */
export function unanswered(topicIds: string[], history: FinishedSession[] | null): string[] {
  const latest = latestResults(history);
  return scopeItemIds(topicIds).filter((id) => !latest.has(id));
}

export type TopicReadiness = { sectionId: string; readiness: number; total: number };

/** Readiness per topic of the exam, the weakest first (ties in guide order). */
export function topicReadiness(
  topicIds: string[],
  history: FinishedSession[] | null,
): TopicReadiness[] {
  return knownTopics(topicIds)
    .map((sectionId) => {
      const ids = scopeItemIds([sectionId]);
      return { sectionId, readiness: readinessOver(ids, history), total: ids.length };
    })
    .sort(
      (a, b) => a.readiness - b.readiness || sectionOrder(a.sectionId) - sectionOrder(b.sectionId),
    );
}

/** Whether the exam's readiness asks for another look: below the pass mark. */
export const isReady = (readiness: number) => readiness >= EXAM_PASS_MARK;

/** Whether "Repeat weak topics" has anything to bring back. */
export function hasWeakTopics(topicIds: string[], history: FinishedSession[] | null): boolean {
  return mistakes(topicIds, history).length > 0 || unanswered(topicIds, history).length > 0;
}

/**
 * The questions of a "Repeat weak topics" session, at most `limit`: the mistakes first, the weakest
 * topic first, then the unanswered questions of the weakest topic while there is room. The rest
 * stay for the next session.
 */
export function weakSessionIds(
  topicIds: string[],
  history: FinishedSession[] | null,
  limit: number = REPEAT_SESSION_QUESTIONS,
): string[] {
  const order = topicReadiness(topicIds, history).map((topic) => topic.sectionId);
  if (order.length === 0) return [];
  const wrong = new Set(mistakes(topicIds, history));
  const sections = new Map(
    [...modeItems("scenario"), ...modeItems("quiz")].map((item) => [item.id, item.section]),
  );
  const rank = (id: string) => order.indexOf(sections.get(id) ?? "");
  const picked = scopeItemIds(topicIds)
    .filter((id) => wrong.has(id))
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, limit);
  if (picked.length < limit) {
    const open = new Set(unanswered(topicIds, history));
    const weakest = scopeItemIds([order[0]]).filter((id) => open.has(id));
    picked.push(...weakest.slice(0, limit - picked.length));
  }
  return picked;
}

/**
 * The readiness a session record stores (`readinessAfter`): the readiness of the assigned exam's
 * scope after the session, or of all topics when no exam is assigned. `history` includes the session.
 */
export function readinessAfter(history: FinishedSession[], examTopicIds: string[] | null): number {
  return examReadiness(examTopicIds ?? trainingSections, history);
}
