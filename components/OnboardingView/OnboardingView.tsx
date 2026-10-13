"use client";

import { FileCheck2, RefreshCw, Target } from "lucide-react";
import { useEffect, useRef } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { FINAL_STEP, onboardingSteps, stepLabel } from "@/lib/onboarding";
import type { OnboardingStep } from "@/lib/onboarding";

const icons = [Target, FileCheck2, RefreshCw];

/** A horizontal swipe of at least this many pixels moves one step. */
const SWIPE = 50;

/** The first-run introduction: three short steps, then "Ready to start?". */
export function OnboardingView({
  step,
  onNext,
  onBack,
  onSkip,
  onFinish,
}: {
  step: OnboardingStep;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onFinish: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const touchStart = useRef<number | null>(null);
  const final = step === FINAL_STEP;
  const content = final ? null : onboardingSteps[step as 0 | 1 | 2];
  const Icon = icons[step];

  // Focus moves to the new headline when the step changes, not on the first screen.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  return (
    <div
      className="flex min-h-[calc(100dvh-11rem)] flex-col"
      onTouchStart={(event) => {
        touchStart.current = event.touches[0].clientX;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const distance = event.changedTouches[0].clientX - touchStart.current;
        touchStart.current = null;
        if (distance < -SWIPE && !final) onNext();
        if (distance > SWIPE && step > 0) onBack();
      }}
    >
      <div className="flex min-h-11 items-center justify-between">
        <div>{step > 0 && <CircleBackButton label="Previous step" onClick={onBack} />}</div>
        {!final && (
          <div className="-mr-3">
            <Button variant="text" onClick={onSkip}>
              Skip
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center gap-3 py-8">
        {content && (
          <>
            <span
              aria-hidden="true"
              className="mb-3 flex h-22 w-22 items-center justify-center rounded-full bg-next-tile text-text"
            >
              <Icon size={40} strokeWidth={1.75} />
            </span>
            <p className="type-label text-text-secondary">{stepLabel(step)}</p>
          </>
        )}
        <h1 ref={headingRef} tabIndex={-1} className="type-display">
          {content ? content.title : "Ready to start?"}
        </h1>
        <p className="text-text-secondary">
          {content ? content.body : "Upload a guide or try the sample materials."}
        </p>
        {final && (
          <p className="type-small text-text-secondary">
            AI behavior is simulated for this prototype. All feedback comes from the source guide.
          </p>
        )}
      </div>

      <ActionBar>
        {!final && (
          <div role="img" aria-label={stepLabel(step)} className="flex justify-center gap-2 pb-2">
            {onboardingSteps.map((item, index) => (
              <span
                key={item.title}
                className={`h-2 w-2 rounded-full ${index === step ? "bg-primary" : "bg-neutral-surface"}`}
              />
            ))}
          </div>
        )}
        {final ? (
          <Button onClick={onFinish}>Get started</Button>
        ) : (
          <Button onClick={onNext}>{step === 2 ? "Continue" : "Next"}</Button>
        )}
      </ActionBar>
    </div>
  );
}
