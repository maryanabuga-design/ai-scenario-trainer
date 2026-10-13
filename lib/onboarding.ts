import { defaultDirection } from "@/lib/directions";
import type { Profile } from "@/lib/session";

/** The three steps of the first-run introduction. The final screen comes after them. */
export const onboardingSteps = [
  {
    title: "Practise a decision",
    body: "You get a realistic situation and choose what to do.",
  },
  {
    title: "Explain it, then check it",
    body: "Say how confident you are and explain your choice in your own words. Every answer is checked against your source guide.",
  },
  {
    title: "See what to repeat",
    body: "You see which mistakes were guesses, gaps or misconceptions, and repeat only those topics.",
  },
] as const;

/** 0 to 2 are the steps; 3 is the final "Ready to start?" screen. */
export type OnboardingStep = 0 | 1 | 2 | 3;

export const FINAL_STEP: OnboardingStep = 3;

/** Where "How it works" on Home replays the introduction. */
export const onboardingHref = "/onboarding";

export function nextStep(step: OnboardingStep): OnboardingStep {
  return Math.min(step + 1, FINAL_STEP) as OnboardingStep;
}

export function previousStep(step: OnboardingStep): OnboardingStep {
  return Math.max(step - 1, 0) as OnboardingStep;
}

/** The text that stands for the position dots. */
export function stepLabel(step: OnboardingStep) {
  return `Step ${step + 1} of ${onboardingSteps.length}`;
}

/** Home shows the introduction until it has been finished or skipped once. */
export function needsOnboarding(profile: Profile | null): boolean {
  return !profile?.onboarded;
}

/** The profile to save after Skip or Get started, or null on a replay: a replay changes nothing. */
export function finishOnboarding(profile: Profile | null): Profile | null {
  if (profile?.onboarded) return null;
  return { direction: profile?.direction ?? defaultDirection.id, onboarded: true };
}
