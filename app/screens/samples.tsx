"use client";

import { useEffect, useRef, useState } from "react";
import { DecisionStep, emptyDraft } from "@/components/DecisionStep/DecisionStep";
import type { Draft } from "@/components/DecisionStep/DecisionStep";
import { FeedbackView } from "@/components/FeedbackView/FeedbackView";
import { SessionSetup } from "@/components/SessionSetup/SessionSetup";
import type { Length } from "@/components/SessionSetup/SessionSetup";
import { simulatedFeedback } from "@/lib/feedback";
import { getStep, scenario } from "@/lib/scenario";

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
