"use client";

import { ListChecks } from "lucide-react";
import Link from "next/link";
import { ARROW_CLEARANCE, ArrowCircle } from "@/components/ArrowCircle/ArrowCircle";
import { Button } from "@/components/Button/Button";
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
      <Card className="relative flex flex-col gap-3">
        <Link href="/weak-topics" className="-m-1 flex items-center gap-3 rounded-panel p-1">
          <ArrowCircle />
          <span className={`flex min-w-0 flex-1 flex-col gap-1 ${ARROW_CLEARANCE.md}`}>
            <h2 id="repeat-title" className="type-item-title">
              <span className="tabular-nums">{topics.length}</span>{" "}
              {topics.length === 1 ? "topic" : "topics"} to repeat
            </h2>
            <span className="type-small text-text-secondary">
              {describeCounts(countTopics(topics))}
            </span>
          </span>
          <span className="sr-only">, see all weak topics</span>
        </Link>
        <Button onClick={() => onRepeat(topics)}>Repeat weak topics</Button>
      </Card>

      <div className="flex flex-col gap-2">
        <h3 id="topics-title" className="type-item-title">
          Topics
        </h3>
        <TopicRow
          topics={topics}
          labelledBy="topics-title"
          onRepeat={(topic) => onRepeat([topic])}
        />
      </div>
    </section>
  );
}
