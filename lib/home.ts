import { getItem } from "@/lib/items";
import { questions } from "@/lib/quiz";
import { scenarios } from "@/lib/scenario";
import { scoreSession, weakItemsFromHistory } from "@/lib/progress";
import type { FinishedSession, Session } from "@/lib/session";
import { sessionLabel } from "@/lib/session";
import { pickQuizItems } from "@/lib/setup";
import { checklists } from "@/lib/checklists";

/** The Mini-session: the only session with 5 questions (Session setup offers 10, 20 and 30). */
export const MINI_SESSION_LENGTH = 5;

/** 5 random quiz questions, spread over the guide sections. */
export function miniSessionIds(random: () => number = Math.random): string[] {
  const sections = [...new Set(questions.map((question) => question.section))];
  return pickQuizItems(sections, MINI_SESSION_LENGTH, random);
}

/** Every step and question the person can be asked. */
export const availableQuestionCount = () =>
  questions.length + scenarios.reduce((sum, def) => sum + def.steps.length, 0);

/**
 * Readiness: the unique questions answered correctly in the latest attempt, divided by all
 * available questions, as a whole percent rounded down. Only the most recent answer to a question
 * counts; 0 when nothing is done.
 */
export function readiness(history: FinishedSession[] | null): number {
  const latest = new Map<string, boolean>();
  [...(history ?? [])]
    .sort((a, b) => a.finishedAt - b.finishedAt)
    .flatMap((session) => scoreSession(session))
    .forEach((item) => latest.set(item.id, item.correct));
  const total = availableQuestionCount();
  if (total === 0) return 0;
  const right = [...latest.entries()].filter(([id, correct]) => correct && itemExists(id)).length;
  return Math.floor((right / total) * 100 + 1e-9);
}

function itemExists(id: string) {
  try {
    getItem(id);
    return true;
  } catch {
    return false;
  }
}

export type ContinueCard = {
  kind: "continue" | "start";
  title: string;
  subtitle: string;
  /** Where it goes: the session, or Session setup. */
  href: string;
};

/** The big card: Continue with the mode and position of an unfinished session, otherwise Start training. */
export function continueCard(unfinished: Session | null): ContinueCard {
  if (unfinished) {
    return {
      kind: "continue",
      title: "Continue",
      subtitle: `${sessionLabel(unfinished)} · Question ${unfinished.index + 1} of ${unfinished.itemIds.length}`,
      href: "/session",
    };
  }
  return {
    kind: "start",
    title: "Start training",
    subtitle: "Choose a scenario or a quiz",
    href: "/session/setup",
  };
}

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

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** The six tiles, each with its own pastel, its count line and where it goes. */
export function homeTiles(counts: HomeCounts): HomeTile[] {
  return [
    {
      id: "scenarios",
      title: "Scenarios",
      count: plural(counts.scenarios, "scenario", "scenarios"),
      href: "/session/setup?mode=scenario",
      tone: "yellow",
    },
    {
      id: "quiz",
      title: "Quiz",
      count: plural(counts.questions, "question", "questions"),
      href: "/session/setup?mode=quiz",
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
    scenarios: scenarios.length,
    questions: questions.length,
    weakSections: new Set(weak.map((item) => item.section)).size,
    saved: (saved ?? []).filter(itemExists).length,
    guideSections,
    checklists: checklists.length,
  };
}
