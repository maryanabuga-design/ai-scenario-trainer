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
 * The pictures of Home's hero card and Mini-quiz row (`public/heroes/hero-training.webp` and
 * `icon-miniquiz.webp`). A slot with no picture shows the dashed "3D" placeholder.
 */
export const homeImages: { heroTraining?: string; iconMiniQuiz?: string } = {
  heroTraining: "/heroes/hero-training.webp",
  iconMiniQuiz: "/heroes/icon-miniquiz.webp",
};

/** The non-transparent box of a picture, as fractions of its file (x0, y0, x1, y1 from 0 to 1). */
export type Artwork = { x0: number; y0: number; x1: number; y1: number };

/**
 * Where the artwork sits inside each Home picture's file, measured from the pixels (both files are
 * 1254 by 1254 with transparent margins): the books 312..945 by 347..933, the clipboard 297..984
 * by 221..990. A test measures the files again and fails if these drift.
 */
export const homeArtwork: Record<"heroTraining" | "iconMiniQuiz", Artwork> = {
  heroTraining: { x0: 312 / 1254, y0: 347 / 1254, x1: 945 / 1254, y1: 933 / 1254 },
  iconMiniQuiz: { x0: 297 / 1254, y0: 221 / 1254, x1: 984 / 1254, y1: 990 / 1254 },
};

/** The share of the frame the artwork may fill: 1% to spare so no edge is touched. */
export const ARTWORK_FILL = 0.99;

/** The fixed frames of Home's two pictures in px: 60px is a title with two small lines. */
export const homeFrames = {
  tile: { width: 76, height: 60 },
  row: { width: 64, height: 60 },
} as const;

/**
 * The transform that makes the artwork fill its frame without editing the file. With
 * `object-fit: contain` the file is drawn as a square of the frame's shorter side, centred; scale
 * about the frame's centre until the artwork height fills the frame (or its width, when that comes
 * first) and move the artwork's centre to the frame's centre. Offsets are in px.
 */
export function artworkTransform(
  art: Artwork,
  frame: { width: number; height: number },
): { scale: number; x: number; y: number } {
  const side = Math.min(frame.width, frame.height);
  const scale = Math.min(
    (ARTWORK_FILL * frame.height) / ((art.y1 - art.y0) * side),
    (ARTWORK_FILL * frame.width) / ((art.x1 - art.x0) * side),
  );
  const centreX = (art.x0 + art.x1) / 2;
  const centreY = (art.y0 + art.y1) / 2;
  return { scale, x: -(centreX - 0.5) * side * scale, y: -(centreY - 0.5) * side * scale };
}

export type HomeCounts = {
  /** The best exam result in percent, or null when no exam was taken. */
  bestExam: { correct: number; questions: number } | null;
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
};

/** The four tiles (all in the one neutral tile), each with its count line and where it goes. */
export function homeTiles(counts: HomeCounts): HomeTile[] {
  return [
    {
      id: "exam",
      title: "Exam",
      count:
        counts.bestExam === null
          ? "Not taken yet"
          : `Best: ${counts.bestExam.correct} of ${counts.bestExam.questions}`,
      href: "/exam",
    },
    {
      id: "steps",
      title: "Steps",
      count: plural(counts.checklists, "checklist", "checklists"),
      href: "/checklists",
    },
    {
      id: "weak",
      title: "Weak topics",
      count:
        counts.weakSections === 0
          ? "Nothing to repeat"
          : `${plural(counts.weakSections, "section", "sections")} to repeat`,
      href: "/weak-topics",
    },
    {
      id: "saved",
      title: "Saved questions",
      count: `${counts.saved} saved`,
      href: "/saved",
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
  const bestAttempt = examResults(history).best;
  return {
    bestExam: bestAttempt && { correct: bestAttempt.correct, questions: bestAttempt.questions },
    weakSections: new Set(weak.map((item) => item.section)).size,
    saved: (saved ?? []).filter((id) => findItem(id) !== undefined).length,
    checklists: checklists.length,
  };
}
