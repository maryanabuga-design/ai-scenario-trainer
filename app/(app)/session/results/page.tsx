"use client";

import { useRouter } from "next/navigation";
import { ButtonLink } from "@/components/Button/Button";
import { ResultsView } from "@/components/ResultsView/ResultsView";
import { getStep } from "@/lib/scenario";
import { scoreAnswer } from "@/lib/scoring";
import { startSession, useSession } from "@/lib/session";

export default function ResultsPage() {
  const router = useRouter();
  const session = useSession();

  if (session === "loading") return null;
  if (!session || !session.finished) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="font-serif text-2xl">No results yet</h1>
        <p className="text-text-secondary">Finish a session to see its results here.</p>
        <ButtonLink href="/materials" variant="secondary">
          Go to Materials
        </ButtonLink>
      </div>
    );
  }

  return (
    <ResultsView
      mode={session.mode}
      answers={session.answers.map((answer) =>
        scoreAnswer(getStep(answer.stepId), answer.optionId, answer.confidence),
      )}
      onRepeat={(stepIds) => {
        startSession("repeat", stepIds);
        window.scrollTo(0, 0);
        router.push("/session");
      }}
    />
  );
}
