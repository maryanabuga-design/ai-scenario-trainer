import { findItem } from "@/lib/items";
import { weakItemsFromHistory } from "@/lib/progress";
import type { FinishedSession, Session } from "@/lib/session";
import { checklists } from "@/lib/checklists";
import { DAILY_GOAL, questionsToday } from "@/lib/daily-goal";
import { PASS_MARK } from "@/lib/config";
import type { PartRecords } from "@/lib/part-progress";
import { modeItems, partsFor, trainingSections } from "@/lib/parts";

export { readinessOf as readiness } from "@/lib/part-progress";

export type SegmentState = "done" | "in progress" | "not started";

export type HomeSummary = {
  /** The one sentence under the greeting. */
  subtitle: string;
  /** The daily goal: questions answered today (at most the goal) and the goal. */
  goal: { done: number; goal: number };
  /** One segment per guide section, in guide order. */
  strip: { sectionId: string; state: SegmentState }[];
};

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * The topic strip: done when every part of the section (both modes) has a latest result at or
 * above the pass mark, in progress when at least one part has a finished attempt, else not started.
 */
export function topicStrip(records: PartRecords | null): HomeSummary["strip"] {
  const parts = [...partsFor("scenario"), ...partsFor("quiz")];
  return trainingSections.map((sectionId) => {
    const own = parts.filter((part) => part.sectionId === sectionId);
    const results = own.map((part) => records?.[part.id]);
    const state: SegmentState =
      own.length > 0 && results.every((record) => record && record.lastPercent >= PASS_MARK)
        ? "done"
        : results.some(Boolean)
          ? "in progress"
          : "not started";
    return { sectionId, state };
  });
}

/**
 * What Home says under the greeting, first match wins: an unfinished session, nothing started,
 * weak topics, the daily goal not reached, otherwise "ready".
 */
export function homeSummary({
  unfinished,
  history,
  records,
  now,
}: {
  unfinished: Session | null;
  history: FinishedSession[] | null;
  records: PartRecords | null;
  now: Date;
}): HomeSummary {
  const weakSections = new Set(weakItemsFromHistory(history).map((item) => item.section)).size;
  const done = questionsToday(history, now);

  let subtitle: string;
  if (unfinished) {
    subtitle = `You stopped at question ${unfinished.index + 1} of ${unfinished.itemIds.length}.`;
  } else if ((history ?? []).length === 0) {
    subtitle = "Start with your first scenario.";
  } else if (weakSections > 0) {
    subtitle = `${plural(weakSections, "topic needs", "topics need")} another look.`;
  } else if (done < DAILY_GOAL) {
    subtitle = `${plural(DAILY_GOAL - done, "more question", "more questions")} to reach today's goal.`;
  } else {
    subtitle = "You are ready. Try a mini-quiz to stay sharp.";
  }
  return {
    subtitle,
    goal: { done: Math.min(done, DAILY_GOAL), goal: DAILY_GOAL },
    strip: topicStrip(records),
  };
}

/** "1 scenario · 33 quiz questions". */
export function heroCountsLine(scenarios: number, questions: number): string {
  return `${plural(scenarios, "scenario", "scenarios")} · ${plural(questions, "quiz question", "quiz questions")}`;
}

/**
 * The pictures of Home's hero tile and Mini-quiz row icon. Until a file is added to `public/heroes/`
 * (`hero-training.webp`, `icon-miniquiz.webp`) the placeholders show.
 */
export const homeImages: { heroTraining?: string; iconMiniQuiz?: string } = {};

/** The numbers on the hero card: the scenario count and quiz questions of the selected guide. */
export const heroCounts = {
  scenarios: 1,
  questions: modeItems("quiz").length,
};

export type HomeCounts = {
  scenarios: number;
  questions: number;
  weakSections: number;
  saved: number;
  guideSections: number;
  checklists: number;
};

export type HomeTileId = "scenarios" | "quiz" | "weak" | "saved" | "guide" | "checklists";

export type HomeTile = {
  id: HomeTileId;
  title: string;
  /** The small count line under the title. */
  count: string;
  href: string;
  tone: "yellow" | "blue" | "peach" | "lilac" | "green" | "sand";
};

/** The six tiles, each with its own pastel, its count line and where it goes. */
export function homeTiles(counts: HomeCounts): HomeTile[] {
  return [
    {
      id: "scenarios",
      title: "Scenarios",
      count: plural(counts.scenarios, "scenario", "scenarios"),
      href: "/training?mode=scenario",
      tone: "yellow",
    },
    {
      id: "quiz",
      title: "Quiz",
      count: plural(counts.questions, "question", "questions"),
      href: "/training?mode=quiz",
      tone: "blue",
    },
    {
      id: "weak",
      title: "Weak topics",
      count:
        counts.weakSections === 0
          ? "Nothing to repeat"
          : `${plural(counts.weakSections, "section", "sections")} to repeat`,
      href: "/weak-topics",
      tone: "peach",
    },
    {
      id: "saved",
      title: "Saved questions",
      count: `${counts.saved} saved`,
      href: "/saved",
      tone: "lilac",
    },
    {
      id: "guide",
      title: "Guide",
      count: plural(counts.guideSections, "section", "sections"),
      href: "/materials",
      tone: "green",
    },
    {
      id: "checklists",
      title: "Quick checklists",
      count: plural(counts.checklists, "checklist", "checklists"),
      href: "/checklists",
      tone: "sand",
    },
  ];
}

/** The numbers on the tiles, from what is saved in this browser. */
export function homeCounts({
  history,
  saved,
  guideSections,
}: {
  history: FinishedSession[] | null;
  saved: string[] | null;
  guideSections: number;
}): HomeCounts {
  const weak = weakItemsFromHistory(history);
  return {
    scenarios: heroCounts.scenarios,
    questions: heroCounts.questions,
    weakSections: new Set(weak.map((item) => item.section)).size,
    saved: (saved ?? []).filter((id) => findItem(id) !== undefined).length,
    guideSections,
    checklists: checklists.length,
  };
}
