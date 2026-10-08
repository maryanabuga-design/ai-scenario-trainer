"use client";

import { useEffect, useRef, useState } from "react";
import { DecisionStep, emptyDraft } from "@/components/DecisionStep/DecisionStep";
import type { Draft } from "@/components/DecisionStep/DecisionStep";
import { FeedbackView } from "@/components/FeedbackView/FeedbackView";
import { HomeView } from "@/components/HomeView/HomeView";
import { OnboardingView } from "@/components/OnboardingView/OnboardingView";
import type { OnboardingStep } from "@/components/OnboardingView/OnboardingView";
import { ProgressView } from "@/components/ProgressView/ProgressView";
import { ResultsView } from "@/components/ResultsView/ResultsView";
import { SessionSetup } from "@/components/SessionSetup/SessionSetup";
import type { Length } from "@/components/SessionSetup/SessionSetup";
import { simulatedFeedback } from "@/lib/feedback";
import { getStep, scenario } from "@/lib/scenario";
import { defaultDirection } from "@/lib/directions";
import { currentWeakAnswers, scoreAnswer } from "@/lib/scoring";

/** Interactive sample screens for the /screens review page. They never touch the saved session. */
export function SetupSample() {
  const [length, setLength] = useState<Length>("full");
  return <SessionSetup length={length} onLengthChange={setLength} onStart={() => undefined} />;
}

const sampleStep = scenario.steps[0];

/** The decision step with a starting draft: nothing chosen, an option chosen, or everything filled. */
export function DecisionSample({ start }: { start: "empty" | "option" | "complete" }) {
  const drafts: Record<typeof start, Draft> = {
    empty: emptyDraft,
    option: { ...emptyDraft, optionId: "b" },
    complete: {
      optionId: "b",
      confidence: 2,
      explanation: "An alarm counts as real, so everyone leaves by the stairs right away.",
    },
  };
  const [draft, setDraft] = useState<Draft>(drafts[start]);
  const endRef = useScrollFrameToEnd(start !== "empty");

  return (
    <>
      <DecisionStep
        step={sampleStep}
        index={0}
        total={scenario.steps.length}
        draft={draft}
        onDraftChange={setDraft}
        onSubmit={() => undefined}
      />
      <div ref={endRef} />
    </>
  );
}

function useScrollFrameToEnd(enabled: boolean) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!enabled) return;
    // Wait for fonts and layout so the frame scrolls to its real end.
    const timer = setTimeout(() => {
      const frame = endRef.current?.closest("[data-frame-scroll]");
      if (frame) frame.scrollTop = frame.scrollHeight;
    }, 500);
    return () => clearTimeout(timer);
  }, [enabled]);
  return endRef;
}

/** Feedback for a wrong answer given with high confidence (step 1, elevator). */
export function FeedbackSample() {
  return (
    <FeedbackView
      feedback={simulatedFeedback.evaluate(getStep("s1"), { optionId: "c", confidence: 3 })}
      explanation="The elevator is the quickest way to get twelve people down."
      index={0}
      total={scenario.steps.length}
      nextLabel="Next step"
      onNext={() => undefined}
    />
  );
}

/** The smoke step after the trainee tapped the suggested question. */
export function AskSample() {
  const endRef = useScrollFrameToEnd(true);
  return (
    <>
      <FeedbackView
        feedback={simulatedFeedback.evaluate(getStep("s3"), { optionId: "a", confidence: 2 })}
        explanation="Staying low keeps us under the smoke."
        index={2}
        total={scenario.steps.length}
        nextLabel="Next step"
        onNext={() => undefined}
        questionAsked
      />
      <div ref={endRef} />
    </>
  );
}

/** A full session with one answer of each kind of result. */
const sampleAnswers = [
  scoreAnswer(getStep("s1"), "b", 3),
  scoreAnswer(getStep("s2"), "c", 2),
  scoreAnswer(getStep("s3"), "b", 3),
  scoreAnswer(getStep("s4"), "d", 3),
  scoreAnswer(getStep("s5"), "a", 1),
  scoreAnswer(getStep("s6"), "c", 3),
];

export function ResultsSample({ scrolled = false }: { scrolled?: boolean }) {
  const endRef = useScrollFrameToEnd(scrolled);
  return (
    <>
      <ResultsView mode="full" answers={sampleAnswers} onRepeat={() => undefined} />
      <div ref={endRef} />
    </>
  );
}

/** A repeat session replays only the weak steps: here the second of three. */
export function RepeatSample() {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  return (
    <DecisionStep
      step={getStep("s3")}
      index={1}
      total={3}
      draft={draft}
      onDraftChange={setDraft}
      onSubmit={() => undefined}
    />
  );
}

/** Home on a first visit (nothing saved) or with an unfinished session and weak topics. */
export function HomeSample({ withProgress = false }: { withProgress?: boolean }) {
  return (
    <HomeView
      directionTitle={defaultDirection.title}
      unfinished={
        withProgress
          ? {
              mode: "full",
              stepIds: scenario.steps.map((step) => step.id),
              index: 2,
              phase: "decide",
              answers: [],
              finished: false,
            }
          : null
      }
      weakAnswers={withProgress ? currentWeakAnswers(sampleAnswers) : []}
      onPractise={() => undefined}
    />
  );
}

/** Progress on a first visit, or after a short and a full session. */
export function ProgressSample({ withHistory = false }: { withHistory?: boolean }) {
  const answer = (stepId: string, optionId: string, confidence: 1 | 2 | 3) => ({
    stepId,
    optionId,
    confidence,
    explanation: "",
  });
  const history = withHistory
    ? [
        {
          mode: "short" as const,
          finishedAt: Date.UTC(2026, 9, 7, 9, 20),
          answers: [answer("s1", "d", 1), answer("s2", "c", 3), answer("s3", "a", 3)],
        },
        {
          mode: "full" as const,
          finishedAt: Date.UTC(2026, 9, 8, 12, 5),
          answers: sampleAnswers.map((scored) => answer(scored.step.id, scored.optionId, 2)),
        },
      ]
    : [];
  return <ProgressView history={history} onPractise={() => undefined} />;
}

export function OnboardingSample({ start }: { start: OnboardingStep }) {
  const [step, setStep] = useState<OnboardingStep>(start);
  const [direction, setDirection] = useState(defaultDirection.id);
  return (
    <OnboardingView
      step={step}
      direction={direction}
      onDirectionChange={setDirection}
      onBack={() => setStep((step - 1) as OnboardingStep)}
      onNext={() => setStep((step + 1) as OnboardingStep)}
      onSkip={() => undefined}
      onTry={() => undefined}
    />
  );
}
