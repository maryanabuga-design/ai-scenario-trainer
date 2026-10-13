"use client";

import { Button } from "@/components/Button/Button";
import { ListChecks } from "lucide-react";
import { ArrowLink } from "@/components/ArrowCircle/ArrowCircle";
import { Card } from "@/components/Card/Card";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { TopicRow } from "@/components/TopicRow/TopicRow";
import type { ScoredItem } from "@/lib/scoring";
import type { WeakTopic } from "@/lib/weak-topics";
import { countTopics, describeCounts, weakTopics } from "@/lib/weak-topics";

/**
 * The repeat summary card and the sideways row of up to five topic cards, by priority.
 * Used on Progress (Home has the Next up card).
 */
export function RepeatSummary({
  weakItems,
  onRepeat,
}: {
  weakItems: ScoredItem[];
  onRepeat: (topics: WeakTopic[]) => void;
}) {
  const topics = weakTopics(weakItems);

  if (topics.length === 0) {
    return (
      <section aria-labelledby="repeat-title" className="flex flex-col gap-3">
        <h2 id="repeat-title" className="type-item-title">
          Weak topics
        </h2>
        <Card>
          <EmptyState
            icon={ListChecks}
            text="No weak topics yet. They appear here after a session or a quiz."
          />
        </Card>
      </section>
    );
  }

  return (
    <section aria-labelledby="repeat-title" className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="repeat-title" className="type-item-title">
            <span className="tabular-nums">{topics.length}</span>{" "}
            {topics.length === 1 ? "topic" : "topics"} to repeat
          </h2>
          <p className="type-small text-text-secondary">{describeCounts(countTopics(topics))}</p>
        </div>
        <Button onClick={() => onRepeat(topics)}>Repeat weak topics</Button>
      </Card>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 id="topics-title" className="type-item-title">
            Topics
          </h3>
          <ArrowLink href="/weak-topics" label="See all" />
        </div>
        <TopicRow
          topics={topics}
          unfinished={null}
          labelledBy="topics-title"
          onRepeat={(topic) => onRepeat([topic])}
        />
      </div>
    </section>
  );
}
