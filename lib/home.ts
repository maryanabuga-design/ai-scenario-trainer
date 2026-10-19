import { findItem } from "@/lib/items";
import { weakItemsFromHistory } from "@/lib/progress";
import type { FinishedSession, Session } from "@/lib/session";
import { checklists } from "@/lib/checklists";
import { examResults } from "@/lib/exam";

export { readinessOf as readiness } from "@/lib/part-progress";

export type HomeSummary = {
  /** The one sentence under the greeting. */
  subtitle: string;
};

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * What Home says under the greeting, first match wins: an unfinished session, nothing started,
 * weak topics, otherwise "ready".
 */
export function homeSummary({
  unfinished,
  history,
}: {
  unfinished: Session | null;
  history: FinishedSession[] | null;
}): HomeSummary {
  const weakSections = new Set(weakItemsFromHistory(history).map((item) => item.section)).size;

  let subtitle: string;
  if (unfinished) {
    subtitle = `You stopped at question ${unfinished.index + 1} of ${unfinished.itemIds.length}.`;
  } else if ((history ?? []).length === 0) {
    subtitle = "Start with your first scenario.";
  } else if (weakSections > 0) {
    subtitle = `${plural(weakSections, "topic needs", "topics need")} another look.`;
  } else {
    subtitle = "You are ready. Try a mini-quiz to stay sharp.";
  }
  return { subtitle };
}

/** The hero card's texts: the title, the line under it and the label of its one button. */
export const HERO_TITLE = "Training materials";
export const HERO_SUBTITLE = "Practical scenarios and theory quizzes, by topic";
export const HERO_BUTTON_LABEL = "Choose a topic";

/**
 * The pictures of Home's hero tile and Mini-quiz row icon. Until a file is added to `public/heroes/`
 * (`hero-training.webp`, `icon-miniquiz.webp`) the placeholders show.
 */
export const homeImages: { heroTraining?: string; iconMiniQuiz?: string } = {};

export type HomeCounts = {
  /** The best exam result in percent, or null when no exam was taken. */
  bestExam: number | null;
  weakSections: number;
  saved: number;
  checklists: number;
};

export type HomeTileId = "exam" | "steps" | "weak" | "saved";

export type HomeTile = {
  id: HomeTileId;
  title: string;
  /** The small count line under the title. */
  count: string;
  href: string;
  tone: "yellow" | "blue" | "peach" | "lilac";
};

/** The four tiles, each with its own pastel, its count line and where it goes. */
export function homeTiles(counts: HomeCounts): HomeTile[] {
  return [
    {
      id: "exam",
      title: "Exam",
      count: counts.bestExam === null ? "Not taken yet" : `Best: ${counts.bestExam}%`,
      href: "/exam",
      tone: "yellow",
    },
    {
      id: "steps",
      title: "Steps",
      count: plural(counts.checklists, "checklist", "checklists"),
      href: "/checklists",
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
  ];
}

/** The numbers on the tiles, from what is saved in this browser. */
export function homeCounts({
  history,
  saved,
}: {
  history: FinishedSession[] | null;
  saved: string[] | null;
}): HomeCounts {
  const weak = weakItemsFromHistory(history);
  return {
    bestExam: examResults(history).best?.percent ?? null,
    weakSections: new Set(weak.map((item) => item.section)).size,
    saved: (saved ?? []).filter((id) => findItem(id) !== undefined).length,
    checklists: checklists.length,
  };
}
