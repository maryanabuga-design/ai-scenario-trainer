"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AskAiProvider } from "@/components/AskAi/AskAi";
import { ButtonLink } from "@/components/Button/Button";
import { DecisionStep, emptyDraft } from "@/components/DecisionStep/DecisionStep";
import type { Draft } from "@/components/DecisionStep/DecisionStep";
import { FeedbackView } from "@/components/FeedbackView/FeedbackView";
import { simulatedFeedback } from "@/lib/feedback";
import { getStep } from "@/lib/scenario";
import type { ScenarioSession } from "@/lib/session";
import { finishSession, isQuiz, saveSession, useSession } from "@/lib/session";

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

function Decide({ session }: { session: ScenarioSession }) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const step = getStep(session.stepIds[session.index]);

  function submit() {
    if (!draft.optionId || !draft.confidence) return;
    const answer = {
      stepId: step.id,
      optionId: draft.optionId,
      confidence: draft.confidence,
      explanation: draft.explanation.trim(),
    };
    saveSession({ ...session, answers: [...session.answers, answer], phase: "feedback" });
    window.scrollTo(0, 0);
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

function Review({ session }: { session: ScenarioSession }) {
  const router = useRouter();
  const step = getStep(session.stepIds[session.index]);
  const answer = session.answers.find((candidate) => candidate.stepId === step.id);
  if (!answer) return <NoSession />;

  const last = session.index === session.stepIds.length - 1;

  function next() {
    if (last) {
      finishSession(session);
      router.push("/session/results");
    } else {
      saveSession({ ...session, index: session.index + 1, phase: "decide" });
      window.scrollTo(0, 0);
    }
  }

  return (
    <FeedbackView
      step={step}
      feedback={simulatedFeedback.evaluate(step, answer)}
      explanation={answer.explanation}
      index={session.index}
      total={session.stepIds.length}
      nextLabel={last ? "See results" : "Next step"}
      onNext={next}
    />
  );
}

export default function SessionPage() {
  const session = useSession();

  if (session === "loading") return null;
  if (!session || session.finished || isQuiz(session)) return <NoSession />;
  return (
    <AskAiProvider>
      {session.phase === "feedback" ? (
        <Review session={session} />
      ) : (
        <Decide key={session.index} session={session} />
      )}
    </AskAiProvider>
  );
}
