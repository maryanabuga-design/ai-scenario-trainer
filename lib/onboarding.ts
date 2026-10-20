import type { Role } from "@/lib/role";

/**
 * The onboarding (DESIGN.md: Onboarding screen): three slides per role, shown once per account.
 * Each slide has a 3D slot (a name from `heroSlots`), a title and a short subtitle. Pure.
 */
export type Slide = {
  slot: "onboarding-practise" | "onboarding-mistakes" | "onboarding-exam";
  title: string;
  body: string;
};

export const studentSlides: Slide[] = [
  {
    slot: "onboarding-practise",
    title: "Practise real situations",
    body: "Short scenarios and quizzes you can do in a few minutes.",
  },
  {
    slot: "onboarding-mistakes",
    title: "Learn from your mistakes",
    body: "See why an answer is right, and ask AI to explain it.",
  },
  {
    slot: "onboarding-exam",
    title: "Get ready for your exam",
    body: "Track your readiness and repeat the topics that need work.",
  },
];

/** Intro text only: the instructor tools themselves come in a later step. */
export const instructorSlides: Slide[] = [
  {
    slot: "onboarding-practise",
    title: "Build an exam from topics",
    body: "Choose the topics your students need to know.",
  },
  {
    slot: "onboarding-exam",
    title: "Assign it with a deadline",
    body: "Students see the exam and the due date straight away.",
  },
  {
    slot: "onboarding-mistakes",
    title: "Students get notified",
    body: "A new exam appears in their notifications.",
  },
];

export const slidesFor = (role: Role): Slide[] =>
  role === "instructor" ? instructorSlides : studentSlides;

/** Where the introduction lives: the first verification sends a new account here, and "How the app works" in Profile replays it. */
export const onboardingHref = "/onboarding";

/** Where a replay returns to (Skip and Get started): the Profile screen it was opened from. */
export const replayReturnHref = "/profile";

/** The next slide index, never past the last one. */
export const nextIndex = (index: number, count: number): number => Math.min(index + 1, count - 1);

/** The previous slide index, never before the first one. */
export const previousIndex = (index: number): number => Math.max(index - 1, 0);

/** The text that stands for the position dots and the slide label. */
export const stepLabel = (index: number, count: number): string => `Step ${index + 1} of ${count}`;
export const slideLabel = (index: number, count: number): string => `${index + 1} of ${count}`;

/** How far a pointer must move sideways to change the slide, in px. */
export const SWIPE_THRESHOLD = 40;

/**
 * What a pointer movement means: "next" for a swipe to the left, "previous" for a swipe to the
 * right, or null. The sideways movement must reach the threshold and be larger than the vertical
 * one, so a vertical scroll never changes the slide.
 */
export function swipeDirection(dx: number, dy: number): "next" | "previous" | null {
  if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return null;
  return dx < 0 ? "next" : "previous";
}

/** The label of the main button: Next, then Get started on the last slide. */
export const mainLabel = (index: number, count: number): string =>
  index === count - 1 ? "Get started" : "Next";

/** Skip shows on every slide but the last. */
export const showsSkip = (index: number, count: number): boolean => index < count - 1;
