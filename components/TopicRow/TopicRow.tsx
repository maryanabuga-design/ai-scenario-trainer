"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { TopicCard } from "@/components/TopicCard/TopicCard";
import { currentCard, dotCount, topicRow } from "@/lib/home";
import type { WeakTopic } from "@/lib/weak-topics";

/** A mouse must move this far before a press counts as a drag rather than a tap. */
const DRAG_START = 5;
const GAP = 12;

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

/**
 * Up to five topic cards in a row that scrolls sideways and snaps, each 85% wide so the next
 * one peeks in, with decorative pagination dots and a hidden "Card 1 of N" for screen readers.
 * Touch and trackpad scroll natively; a mouse drags the row; arrow keys move between cards.
 */
export function TopicRow({
  topics,
  labelledBy,
  onRepeat,
}: {
  topics: WeakTopic[];
  labelledBy: string;
  onRepeat: (topic: WeakTopic) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);
  const [current, setCurrent] = useState(0);
  const cards = topicRow(topics);
  const dots = dotCount(topics);

  function cardInView(list: HTMLUListElement) {
    const first = list.firstElementChild as HTMLElement | null;
    return currentCard({
      scrollLeft: list.scrollLeft,
      maxScroll: list.scrollWidth - list.clientWidth,
      step: (first?.offsetWidth ?? 1) + GAP,
      count: dots,
    });
  }

  function showCard(index: number, focus = false) {
    const card = listRef.current?.children[index] as HTMLElement | undefined;
    if (!card) return;
    if (focus) card.querySelector("button")?.focus({ preventScroll: true });
    card.scrollIntoView({ behavior: scrollBehavior(), block: "nearest", inline: "start" });
  }

  function onPointerDown(event: PointerEvent<HTMLUListElement>) {
    justDragged.current = false;
    if (event.pointerType !== "mouse" || !listRef.current) return;
    drag.current = { x: event.clientX, left: listRef.current.scrollLeft, moved: false };
  }

  function onPointerMove(event: PointerEvent<HTMLUListElement>) {
    const list = listRef.current;
    if (!drag.current || !list) return;
    const distance = event.clientX - drag.current.x;
    if (!drag.current.moved && Math.abs(distance) < DRAG_START) return;
    drag.current.moved = true;
    // Snapping fights a drag, so it is off until the mouse is released.
    list.style.scrollSnapType = "none";
    list.scrollLeft = drag.current.left - distance;
  }

  function endDrag() {
    const list = listRef.current;
    if (!drag.current || !list) return;
    if (drag.current.moved) {
      justDragged.current = true;
      list.style.scrollSnapType = "";
      showCard(cardInView(list));
    }
    drag.current = null;
  }

  function onKeyDown(event: KeyboardEvent<HTMLLIElement>, index: number) {
    const next =
      event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : null;
    if (next === null || next < 0 || next >= cards.length) return;
    event.preventDefault();
    showCard(next, true);
  }

  return (
    <div className="flex flex-col gap-3">
      <ul
        ref={listRef}
        onScroll={() => listRef.current && setCurrent(cardInView(listRef.current))}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={(event) => {
          // A drag that ends on a card is not a tap.
          if (!justDragged.current) return;
          justDragged.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}
        onDragStart={(event) => event.preventDefault()}
        aria-labelledby={labelledBy}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pt-1 pb-3 select-none"
      >
        {cards.map((topic, index) => (
          <li
            key={topic.sectionId}
            className="w-[85%] shrink-0 snap-start"
            onFocus={() => setCurrent(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            <TopicCard topic={topic} onRepeat={() => onRepeat(topic)} />
          </li>
        ))}
      </ul>
      {dots > 1 && (
        <>
          <div aria-hidden="true" className="flex justify-center gap-2">
            {Array.from({ length: dots }, (_, index) => (
              <span
                key={index}
                className={`h-2 w-2 rounded-full ${index === current ? "bg-primary" : "bg-secondary-sand-pressed"}`}
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
