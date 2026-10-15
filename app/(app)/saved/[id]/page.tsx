"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { AskAiProvider } from "@/components/AskAi/AskAi";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { NoResults } from "@/components/NoResults/NoResults";
import { ReviewQuestion } from "@/components/ReviewQuestion/ReviewQuestion";
import { findItem } from "@/lib/items";
import { isSaved, toggleSaved, useSaved } from "@/lib/saved";

function SavedQuestion() {
  const saved = useSaved();
  const params = useParams<{ id: string }>();
  if (saved === "loading") return null;
  const item = findItem(params.id);
  if (!item) return <NoResults />;
  const isOn = isSaved(saved, item.id);

  return (
    <AskAiProvider>
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-[44px_1fr_44px] items-center">
          <CircleBackButton href="/saved" label="Back to saved questions" />
          <span className="type-small text-center text-text-secondary" role="status">
            {isOn ? "Saved question" : "Removed from saved"}
          </span>
        </div>
        <ReviewQuestion
          item={item}
          choice={null}
          saved={isOn}
          onToggleSaved={() => toggleSaved(item.id)}
        />
        <div className="pb-6" />
      </div>
    </AskAiProvider>
  );
}

/** One saved question, with its right answer and Why, and the bookmark to remove it. */
export default function SavedQuestionPage() {
  return (
    <Suspense fallback={null}>
      <SavedQuestion />
    </Suspense>
  );
}
