"use client";

import { useRef, useState } from "react";
import { TopicCard } from "@/components/TopicCard/TopicCard";
import { dotCount, topicPill, topicRow } from "@/lib/home";
import type { Session } from "@/lib/session";
import type { WeakTopic } from "@/lib/weak-topics";

/**
 * Up to five topic cards in a row that scrolls sideways and snaps, each 85% wide so the next
 * one peeks in, with decorative pagination dots and a hidden "Card 1 of N" for screen readers.
 */
export function TopicRow({
  topics,
  unfinished,
  labelledBy,
  onRepeat,
}: {
  topics: WeakTopic[];
  unfinished: Session | null;
  labelledBy: string;
  onRepeat: (topic: WeakTopic) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);
  const cards = topicRow(topics);
  const dots = dotCount(topics);

  function onScroll() {
    const list = listRef.current;
    const first = list?.firstElementChild as HTMLElement | null;
    if (!list || !first) return;
    const step = first.offsetWidth + 12;
    setCurrent(Math.min(dots - 1, Math.max(0, Math.round(list.scrollLeft / step))));
  }

  return (
    <div className="flex flex-col gap-3">
      <ul
        ref={listRef}
        onScroll={onScroll}
        aria-labelledby={labelledBy}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pt-1 pb-3"
      >
        {cards.map((topic, index) => (
          <li
            key={topic.sectionId}
            className="w-[90%] shrink-0 snap-start"
            onFocus={() => setCurrent(index)}
          >
            <TopicCard
              topic={topic}
              pill={topicPill(topic, unfinished)}
              onRepeat={() => onRepeat(topic)}
            />
          </li>
        ))}
      </ul>
      {dots > 1 && (
        <>
          <div aria-hidden="true" className="flex justify-center gap-2">
            {Array.from({ length: dots }, (_, index) => (
              <span
                key={index}
                className={`h-2 w-2 rounded-full bg-primary ${index === current ? "" : "opacity-25"}`}
              />
            ))}
          </div>
          <p aria-live="polite" className="sr-only">
            Card {current + 1} of {dots}
          </p>
        </>
      )}
    </div>
  );
}
