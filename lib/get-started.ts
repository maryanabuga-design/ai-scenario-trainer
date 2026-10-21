/**
 * The "Get started" card of the Instructor Overview (DESIGN.md: Instructor, Get started). Pure.
 * It is only there while the selected group has no students and no exams; its three steps are
 * done, next (the first one not done) or locked (after it).
 */
export type StartStepId = "invite" | "import" | "assign";
export type StartState = "done" | "next" | "locked";

export type StartStep = {
  id: StartStepId;
  title: string;
  /** The muted line under the title. */
  reason: string;
  href: string;
  state: StartState;
};

export const GET_STARTED = "Get started";

const steps: Omit<StartStep, "state">[] = [
  {
    id: "invite",
    title: "Invite students",
    reason: "Share the group code",
    href: "/instructor/students/invite",
  },
  {
    id: "import",
    title: "Import or review questions",
    reason: "Add and publish your questions",
    href: "/instructor/content",
  },
  {
    id: "assign",
    title: "Assign the first exam",
    reason: "Choose topics and a deadline",
    href: "/instructor/exams/new?from=overview",
  },
];

/** The steps of the card, or null when the group already has students or exams (no card). */
export function getStarted(counts: {
  students: number;
  exams: number;
  publishedSets: number;
}): StartStep[] | null {
  if (counts.students > 0 || counts.exams > 0) return null;
  const done = [
    counts.students > 0,
    counts.publishedSets > 0,
    counts.exams > 0,
  ];
  if (done.every(Boolean)) return null;
  const nextIndex = done.findIndex((flag) => !flag);
  return steps.map((step, index) => ({
    ...step,
    state: done[index] ? "done" : index === nextIndex ? "next" : "locked",
  }));
}
