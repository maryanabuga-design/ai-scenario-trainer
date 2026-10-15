"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AnswerReview } from "@/components/AnswerReview/AnswerReview";
import { AskAiProvider } from "@/components/AskAi/AskAi";
import { NoResults } from "@/components/NoResults/NoResults";
import { reviewAt } from "@/lib/answer-review";
import {
  isQuiz,
  isRepeatRound,
  markFinishedCorrect,
  sessionItems,
  useSession,
} from "@/lib/session";

function Review() {
  const session = useSession();
  const params = useParams<{ position: string }>();
  const fromDetails = useSearchParams().get("from") === "details";

  if (session === "loading") return null;
  if (!session || !session.finished) return <NoResults />;

  const position = Number(params.position);
  const data = reviewAt(session, position);
  if (!data) return <NoResults />;

  const item = sessionItems(session)[position - 1];
  const noun = isRepeatRound(session) ? "item" : isQuiz(session) ? "question" : "step";
  const suffix = fromDetails ? "?from=details" : "";

  return (
    <AskAiProvider>
      <AnswerReview
        data={data}
        noun={noun}
        backHref={fromDetails ? "/session/results/analysis" : "/session/results"}
        backLabel={fromDetails ? "Back to details" : "Back to results"}
        hrefFor={(next) => `/session/results/review/${next}${suffix}`}
        onMarkCorrect={(marked) => markFinishedCorrect(session, item.id, marked)}
      />
    </AskAiProvider>
  );
}

/** The Answer review of one step or question of the last finished session. */
export default function ReviewPage() {
  return (
    <Suspense fallback={null}>
      <Review />
    </Suspense>
  );
}
