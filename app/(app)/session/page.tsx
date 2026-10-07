"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ButtonLink } from "@/components/Button/Button";
import { DecisionStep, emptyDraft } from "@/components/DecisionStep/DecisionStep";
import type { Draft } from "@/components/DecisionStep/DecisionStep";
import { getStep } from "@/lib/scenario";
import type { Session } from "@/lib/session";
import { saveSession, useSession } from "@/lib/session";

function NoSession() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="font-serif text-2xl">No session in progress</h1>
      <p className="text-text-secondary">Start a scenario from a material.</p>
      <ButtonLink href="/materials" variant="secondary">
        Go to Materials
      </ButtonLink>
    </div>
  );
}

function ActiveStep({ session }: { session: Session }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const step = getStep(session.stepIds[session.index]);

  function submit() {
    if (!draft.optionId || !draft.confidence) return;
    const answers = [
      ...session.answers,
      {
        stepId: step.id,
        optionId: draft.optionId,
        confidence: draft.confidence,
        explanation: draft.explanation.trim(),
      },
    ];
    const last = session.index === session.stepIds.length - 1;
    saveSession({
      ...session,
      answers,
      index: last ? session.index : session.index + 1,
      finished: last,
    });
    window.scrollTo(0, 0);
    if (last) router.push("/session/results");
  }

  return (
    <DecisionStep
      step={step}
      index={session.index}
      total={session.stepIds.length}
      draft={draft}
      onDraftChange={setDraft}
      onSubmit={submit}
    />
  );
}

export default function SessionPage() {
  const session = useSession();

  if (session === "loading") return null;
  if (!session || session.finished) return <NoSession />;
  return <ActiveStep key={session.index} session={session} />;
}
