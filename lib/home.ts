import { findItem } from "@/lib/items";
import { questions } from "@/lib/quiz";
import { scenarios } from "@/lib/scenario";
import { weakItemsFromHistory } from "@/lib/progress";
import type { FinishedSession, Session } from "@/lib/session";
import { sessionLabel } from "@/lib/session";
import { checklists } from "@/lib/checklists";

export { readinessOf as readiness } from "@/lib/part-progress";

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
    href: "/training",
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
    scenarios: scenarios.length,
    questions: questions.length,
    weakSections: new Set(weak.map((item) => item.section)).size,
    saved: (saved ?? []).filter((id) => findItem(id) !== undefined).length,
    guideSections,
    checklists: checklists.length,
  };
}
