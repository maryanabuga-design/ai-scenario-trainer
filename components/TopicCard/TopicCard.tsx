"use client";

import { ArrowRight } from "lucide-react";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { TopicTile } from "@/components/TopicTile/TopicTile";
import type { TopicPill } from "@/lib/home";
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
export function TopicCard({
  topic,
  pill,
  onRepeat,
}: {
  topic: WeakTopic;
  pill: TopicPill;
  onRepeat: () => void;
}) {
  const name = useTopicName(topic.sectionId);
  return (
    <button
      type="button"
      onClick={onRepeat}
      className="relative flex h-full w-full flex-col items-start gap-3 rounded-card bg-card p-5 text-left shadow-(--card-shadow) active:bg-surface-muted"
    >
      <span className="flex w-full items-start gap-3">
        <TopicTile icon={topic.icon} />
        <span className="flex flex-1 flex-col items-start gap-1.5 pt-1">
          <span className="type-label rounded-full bg-chip px-2.5 py-1 text-text">
            <span className="sr-only">Repeat: </span>
            {pill.text}
          </span>
          {pill.progress !== null && (
            <span aria-hidden="true" className="h-1 w-20 overflow-hidden rounded-full bg-border">
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${Math.round(pill.progress * 100)}%` }}
              />
            </span>
          )}
        </span>
        <ArrowRight size={20} strokeWidth={2} aria-hidden="true" className="mt-1 shrink-0" />
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
