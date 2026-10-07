"use client";

import { useEffect, useRef, useState } from "react";
import { DecisionStep, emptyDraft } from "@/components/DecisionStep/DecisionStep";
import type { Draft } from "@/components/DecisionStep/DecisionStep";
import { SessionSetup } from "@/components/SessionSetup/SessionSetup";
import type { Length } from "@/components/SessionSetup/SessionSetup";
import { scenario } from "@/lib/scenario";

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
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (start === "empty") return;
    const frame = endRef.current?.closest("[data-frame-scroll]");
    if (frame) frame.scrollTop = frame.scrollHeight;
  }, [start]);

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
