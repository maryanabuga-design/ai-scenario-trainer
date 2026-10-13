"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { OnboardingView } from "@/components/OnboardingView/OnboardingView";
import { finishOnboarding, nextStep, previousStep } from "@/lib/onboarding";
import type { OnboardingStep } from "@/lib/onboarding";
import { saveProfile, useProfile } from "@/lib/session";

export default function Onboarding() {
  const router = useRouter();
  const profile = useProfile();
  const [step, setStep] = useState<OnboardingStep>(0);

  function go(next: OnboardingStep) {
    setStep(next);
    window.scrollTo(0, 0);
  }

  // Skip and Get started mark it done and open Home; a replay saves nothing.
  function finish() {
    const saved = finishOnboarding(profile === "loading" ? null : profile);
    if (saved) saveProfile(saved);
    router.replace("/");
  }

  return (
    <OnboardingView
      step={step}
      onNext={() => go(nextStep(step))}
      onBack={() => go(previousStep(step))}
      onSkip={finish}
      onFinish={finish}
    />
  );
}
