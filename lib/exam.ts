import { EXAM_MINUTES, EXAM_QUESTIONS, EXAM_WARNING_MINUTES } from "@/lib/config";
import type { Item } from "@/lib/items";
import { modeItems, trainingSections } from "@/lib/parts";
import { shuffled } from "@/lib/quiz-draw";
import { findItem } from "@/lib/items";
import type { ExamResult, FinishedSession } from "@/lib/session";

/**
 * The exam questions: `count` questions of the selected guide, a random mix of scenario and quiz
 * questions (half and half when both exist), at least one of every topic when possible, the rest
 * random without repeats, in random order. With fewer questions than `count` all of them are used.
 */
export function drawExam(
  random: () => number,
  count: number = EXAM_QUESTIONS,
  topicIds?: string[],
): string[] {
  const inTopics = (item: Item) => !topicIds || topicIds.includes(item.section);
  const scenario = modeItems("scenario").filter(inTopics);
  const quiz = modeItems("quiz").filter(inTopics);
  if (scenario.length + quiz.length <= count) {
    return shuffled([...scenario, ...quiz], random).map((item) => item.id);
  }

  // How many of each kind: half and half, the other kind making up what one kind cannot give.
  const quizCount = Math.min(count - Math.min(Math.floor(count / 2), scenario.length), quiz.length);
  const room = { scenario: count - quizCount, quiz: quizCount };

  const chosen: { item: Item; mode: "scenario" | "quiz" }[] = [];
  const taken = new Set<string>();
  const take = (item: Item, mode: "scenario" | "quiz") => {
    chosen.push({ item, mode });
    taken.add(item.id);
    room[mode] -= 1;
  };
  const pool = [
    ...scenario.map((item) => ({ item, mode: "scenario" as const })),
    ...quiz.map((item) => ({ item, mode: "quiz" as const })),
  ];

  // One question of every topic first, as long as there is room.
  for (const section of shuffled(
    trainingSections.filter((id) => !topicIds || topicIds.includes(id)),
    random,
  )) {
    if (chosen.length >= count) break;
    const options = pool.filter((entry) => entry.item.section === section && room[entry.mode] > 0);
    if (options.length === 0) continue;
    const pick = options[Math.floor(random() * options.length)];
    take(pick.item, pick.mode);
  }
  // The rest, random without repeats, up to each kind's share.
  for (const entry of shuffled(pool, random)) {
    if (chosen.length >= count) break;
    if (!taken.has(entry.item.id) && room[entry.mode] > 0) take(entry.item, entry.mode);
  }
  return shuffled(chosen, random).map((entry) => entry.item.id);
}

/** Whole seconds left until `endsAt`, never below 0. */
export function secondsLeft(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

/** "19:05". */
export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(whole / 60))}:${pad(whole % 60)}`;
}

/** The timer turns rose in the last EXAM_WARNING_MINUTES minutes. */
export function isTimeWarning(seconds: number): boolean {
  return seconds <= EXAM_WARNING_MINUTES * 60;
}

export const examDurationMs = EXAM_MINUTES * 60 * 1000;

export type ExamAttempt = ExamResult & { finishedAt: number; correct: number };

/** The number of correct answers of a finished exam (an unanswered question counts as wrong). */
export function examCorrect(session: FinishedSession): number {
  const answered = new Map(session.answers.map((answer) => [answer.itemId, answer.optionId]));
  return session.itemIds.filter((id) => {
    const item = findItem(id);
    return item !== undefined && answered.get(id) === item.correctOptionId;
  }).length;
}

/** The last and the best finished exam, from the history. The best is the highest percent, the latest on a tie. */
export function examResults(history: FinishedSession[] | null): {
  last: ExamAttempt | null;
  best: ExamAttempt | null;
} {
  const exams = (history ?? [])
    .flatMap((session) =>
      session.exam
        ? [{ ...session.exam, finishedAt: session.finishedAt, correct: examCorrect(session) }]
        : [],
    )
    .sort((a, b) => a.finishedAt - b.finishedAt);
  if (exams.length === 0) return { last: null, best: null };
  const best = exams.reduce((top, exam) => (exam.percent >= top.percent ? exam : top));
  return { last: exams[exams.length - 1], best };
}
