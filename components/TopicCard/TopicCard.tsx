"use client";

import { ArrowCircle } from "@/components/ArrowCircle/ArrowCircle";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { TopicTile } from "@/components/TopicTile/TopicTile";
import type { WeakTopic } from "@/lib/weak-topics";
import { materialForSection } from "@/lib/weak-topics";

/** The section title, for example "Checking the route", or the code if it is unknown. */
export function useTopicName(sectionId: string) {
  const { sections } = useSourceSheet();
  return sections.find((section) => section.id === sectionId)?.title ?? sectionId;
}

/**
 * A weak topic in the sideways row. The whole card starts the repeat for this topic only, or
 * resumes it when its repeat round is under way.
 */
export function TopicCard({ topic, onRepeat }: { topic: WeakTopic; onRepeat: () => void }) {
  const name = useTopicName(topic.sectionId);
  return (
    <button
      type="button"
      onClick={onRepeat}
      className="relative flex h-full w-full flex-col items-start gap-3 rounded-card bg-card p-5 text-left shadow-(--card-shadow) active:bg-surface-muted"
    >
      <span className="flex w-full items-start gap-3">
        <TopicTile sectionId={topic.sectionId} icon={topic.icon} />
        <span className="flex-1" />
        <ArrowCircle />
      </span>
      <span className="type-item-title">{name}</span>
      <span className="type-small text-text-secondary">
        {materialForSection(topic.sectionId)} · {topic.sectionId}
      </span>
      <span className="mt-auto pt-1">
        <StatusBadge status={topic.errorType} />
      </span>
    </button>
  );
}
