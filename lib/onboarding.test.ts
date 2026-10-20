import { describe, expect, it } from "vitest";
import {
  SWIPE_THRESHOLD,
  instructorSlides,
  mainLabel,
  nextIndex,
  onboardingHref,
  previousIndex,
  replayReturnHref,
  showsSkip,
  slideLabel,
  slidesFor,
  stepLabel,
  studentSlides,
  swipeDirection,
} from "@/lib/onboarding";

describe("the slides", () => {
  it("are three per role with the fixed copy", () => {
    expect(studentSlides.map((s) => [s.slot, s.title, s.body])).toEqual([
      [
        "onboarding-practise",
        "Practise real situations",
        "Short scenarios and quizzes you can do in a few minutes.",
      ],
      [
        "onboarding-mistakes",
        "Learn from your mistakes",
        "See why an answer is right, and ask AI to explain it.",
      ],
      [
        "onboarding-exam",
        "Get ready for your exam",
        "Track your readiness and repeat the topics that need work.",
      ],
    ]);
    expect(instructorSlides.map((s) => [s.slot, s.title, s.body])).toEqual([
      [
        "onboarding-practise",
        "Build an exam from topics",
        "Choose the topics your students need to know.",
      ],
      [
        "onboarding-exam",
        "Assign it with a deadline",
        "Students see the exam and the due date straight away.",
      ],
      [
        "onboarding-mistakes",
        "Students get notified",
        "A new exam appears in their notifications.",
      ],
    ]);
  });

  it("are picked by role", () => {
    expect(slidesFor("student")).toBe(studentSlides);
    expect(slidesFor("instructor")).toBe(instructorSlides);
  });

  it("have a short title and a short body, and name no weapon, harm or combat", () => {
    for (const slide of [...studentSlides, ...instructorSlides]) {
      expect(slide.title.length).toBeLessThanOrEqual(40);
      expect(slide.body.length).toBeLessThanOrEqual(80);
      expect(`${slide.title} ${slide.body}`).not.toMatch(/weapon|combat|kill|attack|gun/i);
    }
  });

  it("live at /onboarding and a replay returns to Profile", () => {
    expect(onboardingHref).toBe("/onboarding");
    expect(replayReturnHref).toBe("/profile");
  });
});

describe("the slide index", () => {
  it("moves on and back but never leaves 0 to 2", () => {
    expect(nextIndex(0, 3)).toBe(1);
    expect(nextIndex(1, 3)).toBe(2);
    expect(nextIndex(2, 3)).toBe(2);
    expect(previousIndex(2)).toBe(1);
    expect(previousIndex(0)).toBe(0);
  });

  it("has the labels for the dots and the slide", () => {
    expect(stepLabel(0, 3)).toBe("Step 1 of 3");
    expect(stepLabel(2, 3)).toBe("Step 3 of 3");
    expect(slideLabel(1, 3)).toBe("2 of 3");
  });

  it("says Next on slides 1 and 2 and Get started on 3; Skip shows only before the last", () => {
    expect([0, 1, 2].map((i) => mainLabel(i, 3))).toEqual(["Next", "Next", "Get started"]);
    expect([0, 1, 2].map((i) => showsSkip(i, 3))).toEqual([true, true, false]);
  });
});

describe("the swipe", () => {
  it("needs the threshold: 40px", () => {
    expect(SWIPE_THRESHOLD).toBe(40);
    expect(swipeDirection(-39, 0)).toBeNull();
    expect(swipeDirection(39, 0)).toBeNull();
    expect(swipeDirection(-40, 0)).toBe("next");
    expect(swipeDirection(40, 0)).toBe("previous");
    expect(swipeDirection(-120, 10)).toBe("next");
  });

  it("never reacts to a vertical scroll, or a movement that is mostly vertical", () => {
    expect(swipeDirection(0, -200)).toBeNull();
    expect(swipeDirection(-50, 80)).toBeNull();
    expect(swipeDirection(50, -50)).toBeNull();
    expect(swipeDirection(-60, 59)).toBe("next");
  });
});
