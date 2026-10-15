"use client";

import { useParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { AnswerReview } from "@/components/AnswerReview/AnswerReview";
import { AskAiProvider } from "@/components/AskAi/AskAi";
import { NoResults } from "@/components/NoResults/NoResults";
import { findItem } from "@/lib/items";
import { isSaved, toggleSaved, useSaved } from "@/lib/saved";
import { answerFor, isValidSession, useSession } from "@/lib/session";

function Review() {
  const session = useSession();
  const saved = useSaved();
  const router = useRouter();
  const params = useParams<{ position: string }>();

  if (session === "loading") return null;
  if (!session || !session.finished || !isValidSession(session)) return <NoResults />;

  const position = Number(params.position);
  const id = session.itemIds[position - 1];
  const item = id ? findItem(id) : undefined;
  if (!item) return <NoResults />;

  return (
    <AskAiProvider>
      <AnswerReview
        item={item}
        choice={answerFor(session, item.id)?.optionId ?? null}
        position={position}
        total={session.itemIds.length}
        backHref="/session/results"
        backLabel="Back to results"
        hrefFor={(next) => `/session/results/review/${next}`}
        marks={session.itemIds.map((id) =>
          answerFor(session, id)?.optionId === findItem(id)?.correctOptionId
            ? "correct"
            : "incorrect",
        )}
        saved={isSaved(saved, item.id)}
        onToggleSaved={() => toggleSaved(item.id)}
        onJump={(index) => router.push(`/session/results/review/${index + 1}`)}
      />
    </AskAiProvider>
  );
}

/** The Answer review of one question of the last finished session. */
export default function ReviewPage() {
  return (
    <Suspense fallback={null}>
      <Review />
    </Suspense>
  );
}
