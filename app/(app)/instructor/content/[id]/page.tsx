"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ButtonLink } from "@/components/Button/Button";
import { PUBLISHED_MESSAGE, ReviewView } from "@/components/InstructorContent/ReviewView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { NO_ROOM, removeSet, updateSet, useContentSets } from "@/lib/content-sets";

/** The friendly screen for a set that is not in this browser. */
export function SetNotFound() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="type-page-title">Set not found</h1>
      <p className="text-text-secondary">It may have been removed from this browser.</p>
      <ButtonLink href="/instructor/content" variant="secondary">
        Back to Content
      </ButtonLink>
    </div>
  );
}

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const sets = useContentSets();
  const { sections } = useSourceSheet();
  const [message, setMessage] = useState("");
  if (sets === "loading") return null;
  const set = sets.find((entry) => entry.id === id);
  if (!set) return <SetNotFound />;
  const topicTitle = sections.find((section) => section.id === set.topic)?.title ?? set.topic;

  return (
    <ReviewView
      set={set}
      topicTitle={topicTitle}
      message={message}
      onPublish={() => {
        const saved = updateSet(set.id, (s) => ({
          ...s,
          status: "published",
          publishedAt: Date.now(),
        }));
        setMessage(saved ? PUBLISHED_MESSAGE : NO_ROOM);
      }}
      onUnpublish={() => {
        updateSet(set.id, (s) => ({ ...s, status: "draft", publishedAt: undefined }));
        setMessage("Unpublished. Students no longer see these questions.");
      }}
      onDelete={() => {
        removeSet(set.id);
        router.push("/instructor/content");
      }}
    />
  );
}
