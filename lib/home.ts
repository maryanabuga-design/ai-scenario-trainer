import { findItem } from "@/lib/items";
import { questions } from "@/lib/quiz";
import { scenarios } from "@/lib/scenario";
import { weakItemsFromHistory } from "@/lib/progress";
import type { FinishedSession, Session } from "@/lib/session";
import { sessionLabel } from "@/lib/session";
import { checklists } from "@/lib/checklists";
import { DAILY_GOAL, questionsToday } from "@/lib/daily-goal";
import { recommendedPart } from "@/lib/part-progress";
import type { PartRecords } from "@/lib/part-progress";
import { partsFor } from "@/lib/parts";
import type { Part } from "@/lib/parts";

export { readinessOf as readiness } from "@/lib/part-progress";

export type HomeCard = {
  kind: "continue" | "start" | "weak" | "next";
  title: string;
  subtitle: string;
  /** Where the card goes. For "next" the card starts `part` first, then opens the session. */
  href: string;
  part?: Part;
};

export type HomeSummary = {
  card: HomeCard;
  /** The one sentence under the greeting. */
  subtitle: string;
  goal: { done: number; goal: number };
};

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

/** The next recommended part: the first part not done in Scenario, otherwise in Quiz. */
export function nextPart(
  records: PartRecords | null,
  unfinished: Pick<Session, "partId" | "finished"> | null,
): Part | null {
  for (const mode of ["scenario", "quiz"] as const) {
    const part = recommendedPart(partsFor(mode), records, unfinished);
    if (part) return part;
  }
  return null;
}

/**
 * What Home says, first match wins. The big card: unfinished session, nothing started, weak topics,
 * otherwise the next part. The sentence under the greeting: unfinished session, nothing started,
 * weak topics, daily goal not reached, otherwise "ready".
 */
export function homeSummary({
  unfinished,
  history,
  records,
  sections,
  now,
}: {
  unfinished: Session | null;
  history: FinishedSession[] | null;
  records: PartRecords | null;
  sections: { id: string; title: string }[];
  now: Date;
}): HomeSummary {
  const weakSections = new Set(
    weakItemsFromHistory(history).map((item) => item.section),
  ).size;
  const done = questionsToday(history, now);
  const goal = { done: Math.min(done, DAILY_GOAL), goal: DAILY_GOAL };
  const nothingStarted = (history ?? []).length === 0;
  const part = nextPart(records, unfinished);

  const start: HomeCard = {
    kind: "start",
    title: "Start training",
    subtitle: "Choose a scenario or a quiz",
    href: "/training",
  };
  let card: HomeCard;
  if (unfinished) {
    card = {
      kind: "continue",
      title: "Continue",
      subtitle: `${sessionLabel(unfinished)} · Question ${unfinished.index + 1} of ${unfinished.itemIds.length}`,
      href: "/session",
    };
  } else if (nothingStarted) {
    card = start;
  } else if (weakSections > 0) {
    card = {
      kind: "weak",
      title: "Repeat weak topics",
      subtitle: `${plural(weakSections, "topic", "topics")} to repeat`,
      href: "/weak-topics",
    };
  } else if (part) {
    const title =
      sections.find((section) => section.id === part.sectionId)?.title ??
      part.sectionId;
    card = {
      kind: "next",
      title: `Next: ${title} · Part ${part.n}`,
      subtitle: `${part.mode === "scenario" ? "Scenario" : "Quiz"} · ${plural(part.itemIds.length, "question", "questions")}`,
      href: "/session",
      part,
    };
  } else {
    card = start;
  }

  let subtitle: string;
  if (unfinished) {
    subtitle = `You stopped at question ${unfinished.index + 1} of ${unfinished.itemIds.length}.`;
  } else if (nothingStarted) {
    subtitle = "Start with your first scenario.";
  } else if (weakSections > 0) {
    subtitle = `${plural(weakSections, "topic needs", "topics need")} another look.`;
  } else if (done < DAILY_GOAL) {
    subtitle = `${plural(DAILY_GOAL - done, "more question", "more questions")} to reach today's goal.`;
  } else {
    subtitle = "You are ready. Try a mini-quiz to stay sharp.";
  }
  return { card, subtitle, goal };
}

export type HomeCounts = {
  scenarios: number;
  questions: number;
  weakSections: number;
  saved: number;
  guideSections: number;
  checklists: number;
};

export type HomeTileId =
  "scenarios" | "quiz" | "weak" | "saved" | "guide" | "checklists";

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
    scenarios: scenarios.length,
    questions: questions.length,
    weakSections: new Set(weak.map((item) => item.section)).size,
    saved: (saved ?? []).filter((id) => findItem(id) !== undefined).length,
    guideSections,
    checklists: checklists.length,
  };
}
