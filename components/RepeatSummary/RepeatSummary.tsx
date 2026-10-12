"use client";

import { Button, ButtonLink } from "@/components/Button/Button";
import { ListChecks } from "lucide-react";
import { Card } from "@/components/Card/Card";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { TopicCard } from "@/components/TopicCard/TopicCard";
import type { ScoredItem } from "@/lib/scoring";
import type { WeakTopic } from "@/lib/weak-topics";
import { countTopics, describeCounts, weakTopics } from "@/lib/weak-topics";

const ROW_LIMIT = 5;

/**
 * The repeat summary card and the sideways row of up to five topic cards, by priority.
 * Used on Home and Progress.
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
        <h2 id="repeat-title" className="text-lg font-medium">
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
          <h2 id="repeat-title" className="text-lg font-medium">
            <span className="tabular-nums">{topics.length}</span>{" "}
            {topics.length === 1 ? "topic" : "topics"} to repeat
          </h2>
          <p className="text-sm text-text-secondary">{describeCounts(countTopics(topics))}</p>
        </div>
        <Button onClick={() => onRepeat(topics)}>Repeat weak topics</Button>
      </Card>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 id="topics-title" className="text-sm font-medium">
            Topics
          </h3>
          <div className="-mr-3">
            <ButtonLink href="/weak-topics" variant="text">
              See all
            </ButtonLink>
          </div>
        </div>
        <ul
          aria-labelledby="topics-title"
          className="-mx-4 flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 pb-2"
        >
          {topics.slice(0, ROW_LIMIT).map((topic) => (
            <li key={topic.sectionId} className="w-[40%] min-w-[136px] shrink-0 snap-start">
              <TopicCard topic={topic} onRepeat={() => onRepeat([topic])} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
