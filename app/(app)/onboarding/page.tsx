"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { OnboardingView } from "@/components/OnboardingView/OnboardingView";
import type { OnboardingStep } from "@/components/OnboardingView/OnboardingView";
import { defaultDirection } from "@/lib/directions";
import { saveProfile } from "@/lib/session";

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>(0);
  const [direction, setDirection] = useState(defaultDirection.id);

  function finish(next: string) {
    saveProfile({ direction, onboarded: true });
    router.replace(next);
  }

  return (
    <OnboardingView
      step={step}
      direction={direction}
      onDirectionChange={setDirection}
      onBack={() => setStep((step - 1) as OnboardingStep)}
      onNext={() => {
        setStep((step + 1) as OnboardingStep);
        window.scrollTo(0, 0);
      }}
      onSkip={() => finish("/")}
      onTry={() => finish("/training/evacuation-guide")}
    />
  );
}
