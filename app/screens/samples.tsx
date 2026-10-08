"use client";

import { useEffect, useRef, useState } from "react";
import { DecisionStep, emptyDraft } from "@/components/DecisionStep/DecisionStep";
import type { Draft } from "@/components/DecisionStep/DecisionStep";
import { AskAiProvider } from "@/components/AskAi/AskAi";
import type { ChatMessage } from "@/components/AskAi/AskAi";
import { FeedbackView } from "@/components/FeedbackView/FeedbackView";
import { HomeView } from "@/components/HomeView/HomeView";
import { OnboardingView } from "@/components/OnboardingView/OnboardingView";
import { ProfileView } from "@/components/ProfileView/ProfileView";
import type { OnboardingStep } from "@/components/OnboardingView/OnboardingView";
import { ProgressView } from "@/components/ProgressView/ProgressView";
import { ResultsView } from "@/components/ResultsView/ResultsView";
import { SessionSetup } from "@/components/SessionSetup/SessionSetup";
import type { Length } from "@/components/SessionSetup/SessionSetup";
import { matchQuestion, notCoveredId, replyToChip } from "@/lib/chat";
import { simulatedFeedback } from "@/lib/feedback";
import { getStep, scenario, sessionLengths } from "@/lib/scenario";
import { defaultDirection } from "@/lib/directions";
import { currentWeakItems, scoreStep } from "@/lib/scoring";

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
        total={sessionLengths.full.stepIds.length}
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
      total={sessionLengths.full.stepIds.length}
      nextLabel="Next step"
      onNext={() => undefined}
      step={getStep("s1")}
    />
  );
}

/** The smoke step's feedback, with "Ask about this step" at the end. */
export function AskSample() {
  const endRef = useScrollFrameToEnd(true);
  return (
    <>
      <FeedbackView
        feedback={simulatedFeedback.evaluate(getStep("s3"), { optionId: "a", confidence: 2 })}
        explanation="Staying low keeps us under the smoke."
        index={2}
        total={sessionLengths.full.stepIds.length}
        nextLabel="Next step"
        onNext={() => undefined}
        step={getStep("s3")}
      />
      <div ref={endRef} />
    </>
  );
}

/** A full session with one answer of each kind of result. */
const sampleAnswers = [
  scoreStep(getStep("s1"), "b", 3),
  scoreStep(getStep("s2"), "c", 2),
  scoreStep(getStep("s3"), "b", 3),
  scoreStep(getStep("s4"), "d", 3),
  scoreStep(getStep("s5"), "a", 1),
  scoreStep(getStep("s6"), "c", 3),
];

export function ResultsSample({ scrolled = false }: { scrolled?: boolean }) {
  const endRef = useScrollFrameToEnd(scrolled);
  return (
    <>
      <ResultsView
        results={{ kind: "scenario", mode: "full" }}
        items={sampleAnswers}
        onRepeat={() => undefined}
      />
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
              stepIds: [...sessionLengths.full.stepIds],
              index: 2,
              phase: "decide",
              answers: [],
              finished: false,
            }
          : null
      }
      weakItems={withProgress ? currentWeakItems(sampleAnswers) : []}
      onRepeatSteps={() => undefined}
      onRepeatQuestions={() => undefined}
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
          answers: sampleAnswers.map((scored, index) =>
            answer(scored.id, ["b", "c", "b", "d", "a", "c"][index], 2),
          ),
        },
      ]
    : [];
  return (
    <ProgressView
      history={history}
      onRepeatSteps={() => undefined}
      onRepeatQuestions={() => undefined}
    />
  );
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

/** Profile, or the reset confirmation drawn in place of the overlay. */
export function ProfileSample({ confirming = false }: { confirming?: boolean }) {
  return (
    <ProfileView
      direction={defaultDirection.id}
      onDirectionChange={() => undefined}
      confirming={confirming}
      onAskReset={() => undefined}
      onCancelReset={() => undefined}
      onReset={() => undefined}
      resetDone={false}
      dialogInline
    />
  );
}

/** The Ask AI sheet open on the decision step: a neutral answer, then a question it holds back. */
export function ChatDecideSample() {
  const step = getStep("s1");
  const messages: ChatMessage[] = [
    { role: "trainee", text: "What if someone needs help to move?", chipId: "s1-assistance" },
    { role: "ai", reply: replyToChip(step, "s1-assistance", "decide") },
    { role: "trainee", text: "Should we take the elevator?" },
    { role: "ai", reply: matchQuestion(step, "Should we take the elevator?", "decide") },
  ];
  return (
    <AskAiProvider inline initial={{ chat: { step, phase: "decide" }, messages }}>
      <DecisionSample start="empty" />
    </AskAiProvider>
  );
}

/** The Ask AI sheet after feedback on the smoke step: a "why not" answer, the not-covered answer, typing. */
export function ChatFeedbackSample() {
  const step = getStep("s3");
  const messages: ChatMessage[] = [
    { role: "trainee", text: "Why not run upright?", chipId: "s3-upright" },
    { role: "ai", reply: replyToChip(step, "s3-upright", "feedback") },
    {
      role: "trainee",
      text: "Which type of cloth filters smoke best?",
      chipId: notCoveredId(step),
    },
    { role: "ai", reply: replyToChip(step, notCoveredId(step), "feedback") },
    { role: "trainee", text: "Why not break a window?", chipId: "s3-window" },
  ];
  return (
    <AskAiProvider inline initial={{ chat: { step, phase: "feedback" }, messages, typing: true }}>
      <AskSample />
    </AskAiProvider>
  );
}
