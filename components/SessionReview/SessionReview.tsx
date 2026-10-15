"use client";

import { useParams, useRouter } from "next/navigation";
import { AnswerReview } from "@/components/AnswerReview/AnswerReview";
import { AskAiProvider } from "@/components/AskAi/AskAi";
import { NoResults } from "@/components/NoResults/NoResults";
import { findItem } from "@/lib/items";
import { isSaved, toggleSaved, useSaved } from "@/lib/saved";
import type { Session } from "@/lib/session";
import { answerFor } from "@/lib/session";

/**
 * The Answer review of one question of a finished session or exam, at the position in the URL.
 * `base` is the Results path: the review pages live under `<base>/review/<position>`.
 */
export function SessionReview({
  session,
  base,
  backLabel,
}: {
  session: Pick<Session, "itemIds" | "answers">;
  base: string;
  backLabel: string;
}) {
  const saved = useSaved();
  const router = useRouter();
  const params = useParams<{ position: string }>();

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
        backHref={base}
        backLabel={backLabel}
        hrefFor={(next) => `${base}/review/${next}`}
        marks={session.itemIds.map((id) =>
          answerFor(session, id)?.optionId === findItem(id)?.correctOptionId
            ? "correct"
            : "incorrect",
        )}
        saved={isSaved(saved, item.id)}
        onToggleSaved={() => toggleSaved(item.id)}
        onJump={(index) => router.push(`${base}/review/${index + 1}`)}
      />
    </AskAiProvider>
  );
}
