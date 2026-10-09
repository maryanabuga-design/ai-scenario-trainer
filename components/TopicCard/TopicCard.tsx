"use client";

import { ChevronRight } from "lucide-react";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { Tag } from "@/components/Tag/Tag";
import type { WeakTopic } from "@/lib/weak-topics";
import { materialForSection } from "@/lib/weak-topics";

/** The section title, for example "Checking the route", or the code if it is unknown. */
export function useTopicName(sectionId: string) {
  const { sections } = useSourceSheet();
  return (
    sections.find((section) => section.id === sectionId)?.title ?? sectionId
  );
}

/** A weak topic in the sideways row. The whole card repeats only this topic. */
export function TopicCard({
  topic,
  onRepeat,
}: {
  topic: WeakTopic;
  onRepeat: () => void;
}) {
  const name = useTopicName(topic.sectionId);
  const count = topic.items.length;
  return (
    <button
      type="button"
      onClick={onRepeat}
      aria-label={`Repeat ${name}: ${count} to repeat, ${materialForSection(topic.sectionId)} ${topic.sectionId}`}
      className="flex h-full w-full flex-col items-start gap-2 rounded-card bg-surface p-4 text-left active:bg-surface-muted"
    >
      <span className="flex w-full items-start justify-between gap-2">
        <Tag
          tone={topic.sectionId.startsWith("F") ? "blue" : "yellow"}
        >{`${count} to repeat`}</Tag>
        <ChevronRight
          size={20}
          strokeWidth={2}
          aria-hidden="true"
          className="shrink-0 text-text-secondary"
        />
      </span>
      <span className="font-medium">{name}</span>
      <span className="text-xs text-text-secondary">
        {materialForSection(topic.sectionId)} · {topic.sectionId}
      </span>
      <span className="mt-auto pt-1">
        <StatusBadge status={topic.errorType} />
      </span>
    </button>
  );
}
