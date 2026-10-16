import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FINAL_STEP,
  finishOnboarding,
  needsOnboarding,
  nextStep,
  onboardingHref,
  onboardingSteps,
  previousStep,
  replayReturnHref,
  stepLabel,
} from "@/lib/onboarding";
import type { OnboardingStep } from "@/lib/onboarding";
import type { Profile } from "@/lib/session";
import { createStore } from "@/lib/store";

describe("first visit", () => {
  it("shows the introduction when nothing is saved yet", () => {
    expect(needsOnboarding(null)).toBe(true);
    expect(needsOnboarding({ direction: "building-evacuation", onboarded: false })).toBe(true);
  });

  it("has three steps and a final screen", () => {
    expect(onboardingSteps.map((step) => step.title)).toEqual([
      "Practise a decision",
      "Answer, then check it",
      "See what to repeat",
    ]);
    expect(FINAL_STEP).toBe(3);
  });
});

describe("moving between steps", () => {
  it("goes 1 → 2 → 3 → final with Next, and stays on the final screen", () => {
    const seen: OnboardingStep[] = [0];
    for (let i = 0; i < 4; i++) seen.push(nextStep(seen[seen.length - 1]));
    expect(seen).toEqual([0, 1, 2, 3, 3]);
  });

  it("goes back one step at a time and never before step 1", () => {
    expect(previousStep(3)).toBe(2);
    expect(previousStep(2)).toBe(1);
    expect(previousStep(1)).toBe(0);
    expect(previousStep(0)).toBe(0);
  });

  it("names the position for the dots", () => {
    expect(stepLabel(1)).toBe("Step 2 of 3");
  });
});

describe("Skip and Get started", () => {
  it("save the flag so Home does not show the introduction again", () => {
    const saved = finishOnboarding(null);
    expect(saved).toEqual({ direction: "building-evacuation", onboarded: true });
    expect(needsOnboarding(saved)).toBe(false);
  });

  it("keep a direction chosen in Profile", () => {
    expect(finishOnboarding({ direction: "other", onboarded: false })?.direction).toBe("other");
  });
});

describe("How it works", () => {
  it("replays the introduction from Home without changing saved data", () => {
    expect(onboardingHref).toBe("/onboarding");
    expect(finishOnboarding({ direction: "building-evacuation", onboarded: true })).toBeNull();
  });
});

describe("when localStorage throws", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the introduction, saves for this visit only and never crashes", () => {
    const fail = () => {
      throw new Error("blocked");
    };
    vi.stubGlobal("window", {
      get localStorage(): Storage {
        throw new Error("blocked");
      },
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    });
    const store = createStore<Profile>("ast.profile.test");
    expect(needsOnboarding(store.read())).toBe(true);
    const saved = finishOnboarding(store.read());
    expect(() => saved && store.write(saved)).not.toThrow();
    expect(needsOnboarding(store.read())).toBe(false);

    // The next visit starts with nothing saved, so the introduction shows again.
    vi.stubGlobal("window", {
      localStorage: { getItem: fail, setItem: fail, removeItem: fail },
    });
    const next = createStore<Profile>("ast.profile.test");
    expect(needsOnboarding(next.read())).toBe(true);
  });
});

describe("replaying the introduction from Profile", () => {
  it("returns to Profile, and the first visit still goes to Home", () => {
    expect(onboardingHref).toBe("/onboarding");
    expect(replayReturnHref).toBe("/profile");
    // a first visit (not onboarded) still needs the introduction; a replay saves nothing
    expect(needsOnboarding(null)).toBe(true);
    expect(needsOnboarding({ direction: "building-evacuation", onboarded: true })).toBe(false);
    expect(finishOnboarding({ direction: "building-evacuation", onboarded: true })).toBeNull();
  });

  it("shows Back on the first step of a replay and names Profile", () => {
    const source = readFileSync("components/OnboardingView/OnboardingView.tsx", "utf8");
    expect(source).toContain('"Back to Profile"');
    const page = readFileSync("app/(app)/onboarding/page.tsx", "utf8");
    expect(page).toContain('router.replace(replay ? replayReturnHref : "/")');
    expect(page).toContain("router.push(replayReturnHref)");
  });
});
