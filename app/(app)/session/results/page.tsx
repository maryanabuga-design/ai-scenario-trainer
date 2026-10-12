"use client";

import { useRouter } from "next/navigation";
import { AskAiProvider } from "@/components/AskAi/AskAi";
import { ButtonLink } from "@/components/Button/Button";
import { ResultsView } from "@/components/ResultsView/ResultsView";
import { scoreSession } from "@/lib/progress";
import { getQuestion } from "@/lib/quiz";
import {
  isQuiz,
  isRepeatRound,
  startQuiz,
  startRepeatRound,
  startSession,
  useSession,
} from "@/lib/session";

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

  const items = scoreSession(session);

  return (
    <AskAiProvider>
      <ResultsView
        results={
          isRepeatRound(session)
            ? { kind: "repeat" }
            : isQuiz(session)
              ? { kind: "quiz", mode: session.mode }
              : { kind: "scenario", mode: session.mode, scenarioId: session.scenarioId }
        }
        items={items}
        onRepeat={(ids) => {
          if (isRepeatRound(session)) {
            const again = items.filter((item) => ids.includes(item.id));
            startRepeatRound(
              again.map((item) => ({ type: item.kind, id: item.id })),
              [...new Set(again.flatMap((item) => item.sources))],
            );
          } else if (isQuiz(session)) {
            startQuiz(ids, [...new Set(ids.map((id) => getQuestion(id).section))], true);
          } else {
            startSession("repeat", ids, session.scenarioId);
          }
          window.scrollTo(0, 0);
          router.push("/session");
        }}
      />
    </AskAiProvider>
  );
}
